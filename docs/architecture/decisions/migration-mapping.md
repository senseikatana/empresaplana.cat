# Mapeo de esquema a producción y control de migraciones

**Familia:** `architecture` · **Estado:** vigente · **Riesgo:** `drift:prisma-path-divergence`

Documento de control. Dice qué objeto del repositorio es el que manda en
producción, quién lo cambia, y qué tiene que fallar para que la producción no
se despegue del repositorio.

---

## 1. Cadena de autoridad

Hay **dos vías** para modificar el esquema y solo una de ellas se aplica sola.

| Vía | Qué hace | Comandos | Se aplica en producción |
| --- | --- | --- | --- |
| **SQL manual** en `/migrations/*.sql` | DDL que Prisma no puede generar: `CHECK`, índices parciales, `ALTER` de datos, `UPDATE` de normalización | Ninguno automático. Se ejecuta a mano contra el DSN | **No** |
| **Prisma derive** desde `prisma/schema.prisma` | `db push` espeja el modelo hacia la base | `bun run db:push`, `bun run db:setup` | Sí, si alguien lo ejecuta |

Esto es la anomalía que este documento existe para hacer visible:

```
prisma.config.ts:7   migrations: { path: "prisma/migrations" }   ← no existe
/migrations/          5 ficheros .sql reales                     ← lo que se usa
package.json          "db:push": "prisma db push"                ← ignora los .sql
```

`prisma migrate` busca en `prisma/migrations`, que no existe en el repositorio.
`prisma db push` no mira ficheros `.sql` en absoluto: deriva DDL de
`schema.prisma`.

**Consecuencia:** ningún comando documentado ejecuta las migraciones escritas a
mano.

## 2. Qué vive en cada fichero SQL y quién lo es responsable

| Fichero | Añade | Responsable |
| --- | --- | --- |
| `20261010092222_initial-prisma-schema.sql` | 16 modelos base con identificadores entrecomillados | engineering |
| `20261010112209_insforge-auth-native.sql` | mapeo de identidad nativa; elimina tablas de auth obsoletas | engineering |
| `20261010121912_create-service-alerts.sql` | `service_alerts`, en snake_case | engineering |
| `20261010130218_fleet-operations.sql` | `VehicleDocument`, `Incident`, `Maintenance` con `ON DELETE RESTRICT` | engineering |
| `20261017120000_tracking-persistence.sql` | columnas de `Report`, `Escalation`, `Review`, índice único parcial, `CHECK` | engineering, product, legal |

El quinto es el que sostiene la reclamación: sin él, los reportes vuelven a ser
efímeros y el escalado duplica. **Es el que no puede perderse.**

## 3. Por qué `schema.prisma` y `/migrations/*.sql` no pueden alterarse por
separado

- Prisma 7 no admite restricciones `CHECK`. Los siete `CHECK` de este esquema
  viven **solo** en SQL. Si alguien reescribe `schema.prisma`, `db push`
  genera una base distinta sin ellos.
- `prisma migrate diff --from-migrations ./migrations --to-schema
  prisma/schema.prisma` **nunca devuelve vacío**: es la prueba de que las dos
  vías están desalineadas a propósito y hay que aplicar ambas.
- El índice único parcial `Escalation_open_window_unique` no es expresable en
  Prisma. Prisma no sabe que existe.

## 4. Mapa de control

| Objeto | Fuente en el repo | Dueño de datos en producción | Quién lo cambia | Cómo se verifica |
| --- | --- | --- | --- | --- |
| `Line`, `SchedulesOnLine`, `LineConnection` | Google Sheets → `sync:sheets` | la hoja (terceros) | quien edita la hoja | `export:sheets` y comparar |
| `Report`, `Escalation`, `Review` | app pública + CRUD | InsForge Postgres | engineering | `bun run verify` + lectura de índices |
| 16 modelos de flota | CRUD de panel | InsForge Postgres | admin vía panel | `management.integration.test.ts` |
| `auth.*`, `auth_sessions` | InsForge Auth | InsForge (terceros) | InsForge | fuera de este repo |
| `service_alerts` | SQL manual | InsForge Postgres | engineering | consulta de existencia |

**`auth_*` es de InsForge.** No se migra desde este repositorio, no se edita a
mano, y `migrations/20261010112209` solo elimina las tablas de auth heredadas.
Quien cambie política de sesión cambia configuración en InsForge y el
repositorio se ajusta, nunca al revés.

## 5. Procedimiento de aplicación (hoy manual, sin atajo)

1. Escribir el fichero en `/migrations/` con fecha y orden de aplicación.
2. Aplicar contra el DSN con una transacción (`BEGIN` / `COMMIT` /
   `ROLLBACK`), dentro de la misma operación que el siguiente paso.
3. Ejecutar `bun run db:generate` para que el cliente generado tenga las
   columnas nuevas.
4. Ejecutar `bun run verify`. Si `astro check` falla, el cliente no se
   regeneró o el modelo está desalineado.

Cada fichero tiene que ser re-ejecutable: `IF NOT EXISTS`, `DROP ... IF EXISTS`
emparejado con `ADD`. Eso no es estilismo — es lo que permite aplicar un script
sobre una base cuyo estado no se ha podido inspeccionar del todo.

## 6. Verificación que se puede correr ahora

```bash
# ¿El DDL generado desde el modelo coincide con el SQL a mano?
npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script | diff - migrations/20261010092222_initial-prisma-schema.sql -

# ¿Las migraciones a mano están todas aplicadas?
# (consulta el catálogo: pg_indexes / information_schema contra el DSN)
```

La segunda es la que conviene automatizar dentro de `verify` cuando decidas
resolver la divergencia de `prisma.config.ts`.

---

**Ver también:** `../decisions/manifest.json` · `../risks/README.md`
(`drift:prisma-path-divergence`) · `../../prisma/config.ts` ·
`../../package.json` (`db:*`)
