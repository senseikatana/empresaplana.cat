# Riesgos: deriva de dependencias

Riesgos que **no controlamos nosotros**: alguien de fuera cambia algo que usamos
y nosotros no lo sabemos. Por eso este directorio existe separado de las
decisiones: nosotros no decidimos el cambio que los causa.

Cada riesgo declara: qué depende de fuera, qué señal lo detecta, quién revisa,
y qué ADR controla su efecto. Un riesgo no apunta a sí mismo, y un ADR no
señala a otro ADR — señala al riesgo que retira.

Estado de revisión: `ok` (visto, sin cambios), `watch` (en la mira),
`open` (efecto sin controlar todavía).

| Riesgo | Depende de | Señal | Revisión | Efecto | Estado | Controlado por |
| --- | --- | --- | --- | --- | --- | --- |
| `drift:fly-runtime` | InsForge Compute / Fly | `bun run deploy:insforge` falla o `astro check` cambia | engineering | el build deja de reproducir | watch | ADR-0001 |
| `drift:astro-major` | Astro | `bun run typecheck` tras bump de mayor | engineering | `output: "server"` y `prerender = false` pueden cambiar de significado | ok | ADR-0001 |
| `drift:sheets-template` | Plantilla de Google Sheets | `sync:sheets` hace seed en columnas que no existen | engineering | las paradas del read model se quedan incompletas | open | ADR-0002, ADR-0011 |
| `drift:prisma-path-divergence` | rutas declaradas en `prisma.config.ts` | `bun run db:drift` | engineering | las migraciones a mano no se aplican y nadie se entera | open | ADR-0012 |
| `drift:prisma-client` | Prisma / adapter-pg | `bun run db:generate` tras bump | engineering | `astro check` cascada con ~44 errores que no existen | ok | ADR-0001 |
| `drift:compute-ephemerality` | política de escalado a cero de Compute | revisar `docs/architecture/decisions/migration-mapping.md` | engineering | evidencia de reclamación perdida en cada reinicio | ok | ADR-0003, ADR-0004 |
| `drift:resend-prod-block` | bloqueo `NODE_ENV=production` en `src/lib/email.ts` | revisar junto al paquete `resend` | engineering, legal | si se habilita correo, la copia actual queda por debajo de lo que hace el sistema | open | ADR-0005 |
| `drift:insforge-auth` | InsForge Auth (terceros) | fallo en `/api/auth/*` o en el `exchange` del OAuth | engineering | nadie puede entrar al panel | watch | ADR-0006, ADR-0009 |
| `drift:missing-stop-coordinates` | lectura del modelo público | — | engineering, product | no hay mapa, no hay distancia, no hay ETA | **open** | ADR-0010 (proposed) |
| `drift:no-trip-entity` | lectura del modelo público | — | engineering, product | no se puede saber qué bus corresponde a qué corrida | **open** | ADR-0010 (proposed) |
| `drift:upstream-release-tooling` | `~/.zsh/functions/git.zsh`, fuera del repo | `bun run release:check` | engineering | la versión publicada no coincide con el código | ok | ADR-0012 |

## Los dos que bloquean todo lo demás

`drift:missing-stop-coordinates` y `drift:no-trip-entity` son los únicos
`open` sin ADR controlador. No son de deriva — son huecos propios, pero los
pongo aquí porque ningún cambio nuestro los cierra por su cuenta: hacen falta
datos (la compañía o un geocodificado) y una decisión.

Mientras esa familia (`realtime`) siga `proposed` en el manifiesto, ningún
componente puede afirmar tiempo real. Eso está escrito en el ADR-0010.

## Nota sobre `service_alerts`

No es un riesgo de deriva sino una tabla huérfana: se crea en
`20261010121912_create-service-alerts.sql` y vive en producción, pero **ningún
código la lee ni la escribe**. `bun run db:drift` la saca como `warn` a
propósito para que siga visible sin dejar el control en rojo permanente.

## El control que mantiene en verde esta tabla

`src/scripts/verify-migrations.mjs` (`bun run db:drift`). Dentro de él,
`declaredListMatches()` es la que coteja `prisma/migrations_path` contra
`MIGRATION_ORDER` de `prisma.config.ts` y contra lo que realmente hay en
`migrations/`. No se compara en ningún otro sitio.

Tres comportamientos que son deliberados:

- Si `DATABASE_URL` falta o la base no responde, el control de aplicación pasa a
  `warn` y no a `fail`. No poder conectar no es lo mismo que no haber aplicado
  nada, y un control que confunde las dos cosas se aprende a ignorar.
- Si se cambia el nombre o la ubicación de `migrations/`, el que se pone en
  `fail` primero es `sql.present`: apunta al directorio declarado y comprueba
  que `.sql` siga ahí.
- `auth_*` se excluye de la comparación por diseño: esas tablas son de
  InsForge y este repositorio no las modela.

---

**Ver también:** `../decisions/manifest.json` · `../adr/` ·
`../architecture/decisions/migration-mapping.md`
