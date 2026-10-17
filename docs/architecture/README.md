# Arquitectura

Este directorio describe **la estructura que sostiene el programa**. No es la
referencia rápida: el contrato de referencia está en `AGENTS.md` en la raíz, que
es donde un agente o un humano nuevo mira primero.

## Reglas de este directorio

- Un documento, una capa. Si una capa se vuelve grande, se parte por capa, no
  por autor.
- Si cambia `AGENTS.md`, este directorio tiene que dejar de estar en desacuerdo
  en el mismo commit o señalarse a sí mismo como obsoleto.
- Nada aquí es propiedad de ningún equipo: se escribe desde la evidencia del
  código, no desde una preferencia.

## Mapa de capas

```
┌─ Delivery ────────────────────────────────────────────────┐
│  .husky/*          lints rápidos (pre-commit, pre-push)   │
│  bun run verify    gate único: biome → astro → tests →    │
│                    e2e → release:check                    │
│  deploy:insforge   verify primero, luego el CLI de deploy │
└───────────────────────────────────────────────────────────┘
        │ bloquea si rojo, nunca compila
        ▼
┌─ Presentación ────────────────────────────────────────────┐
│  src/layouts/*     BaseLayout posee <head> y header       │
│  src/pages/[lang]/*  una página por pantalla, con         │
│                      prerender = false explícito          │
│  src/components/*  islas Vue (client:load) para lo        │
│                    interactivo: panel, seguimiento        │
│  src/config/i18n/* es.json ca.json en.json fr.json        │
│                    1045 claves idénticas en los cuatro    │
└───────────────────────────────────────────────────────────┘
        │ solo por aquí se muestra texto al usuario
        ▼
┌─ Transporte ──────────────────────────────────────────────┐
│  src/middleware/    refresco de sesión, frontera          │
│  src/pages/api/*    REST sin prefijo: /api/*              │
│  src/lib/auth.ts    identidad y rol                       │
│  src/lib/rate-limit.ts  primera barrera en memoria        │
│                     (no distribuida, documentado)         │
└───────────────────────────────────────────────────────────┘
        │ toda entrada validada con zod antes de pasar
        ▼
┌─ Dominio ─────────────────────────────────────────────────┐
│  src/lib/management-schemas.ts   validación y metadatos   │
│  src/lib/tracking-store.ts       reportes, ventanas,      │
│                                  agregación en la base     │
│  src/lib/search.ts               coincidencia de paradas  │
│  src/lib/acl.ts                  capacidades por rol      │
│  src/interfaces/*                tipos                    │
│  prisma/schema.prisma            modelo de datos          │
└───────────────────────────────────────────────────────────┘
        │ sin Astro salvo tres módulos acoplados
        ▼
┌─ Infraestructura ─────────────────────────────────────────┐
│  InsForge Compute (Frankfurt, 512 MB, escala a cero)      │
│  InsForge Auth + Postgres (Prisma 7 + adapter-pg)         │
│  Cloudflare en cima; dominio empresaplana.senseikatana.com│
└───────────────────────────────────────────────────────────┘
```

## Lo que no está en este mapa todavía

Son huecos estructurales, no de documentación. Cada uno tiene su riesgo en
`docs/risks/`:

- **Coordenadas de paradas en el modelo público.** `Line` y `SchedulesOnLine` no
  las llevan: `stopsJson` solo trae texto, y la plantilla de Google Sheets no
  transporta `lat`/`lon`. Sin ellas no hay mapa ni distancia posible.
  *Matiz importante:* el modelo de flota **sí** tiene coordenadas —
  `Stop.lat` / `Stop.lng` están en el esquema. El hueco es de la lectura
  pública. Si ambas familias de paradas se pueden enlazar, una parte del
  problema ya está resuelta y no lo estamos viendo.
- **Entidad de expedición.** Los horarios son cadenas `HH:MM` de un solo día:
  no se puede saber qué bus corresponde a qué corrida.
- **Fuente de posiciones.** Sin ella no hay tiempo real. Ver ADR-0010.

## Control de migraciones

Las migraciones escritas a mano no las aplica ningún comando documentado
(`db:push` deriva del modelo e ignora los `.sql`, y `prisma.config.ts`
apuntaba a un directorio que no existía). El control que lo vigila es:

```bash
bun run db:drift
```

Comprueba que la lista declarada (`prisma/migrations_path`), el orden
(`MIGRATION_ORDER`) y el disco (`migrations/`) dicen lo mismo, y que lo aplicado
coincide con lo declarado. Su registro es
`decisions/migration-mapping.md`.

## Referencia rápida

El contrato de referencia rápido está en `../AGENTS.md`, en la raíz del
repositorio. Si este directorio y ese fichero se contradicen en un mismo commit,
esta carpeta es la que queda obsoleta, no al revés.

## Acoplamiento en tres módulos

`prisma/schema.prisma`, las migraciones, `src/config/i18n/*.json`,
`src/styles/global.css` y 13 de los 16 módulos de `src/lib` no importan nada de
Astro y se portan a cualquier stack sin cambios.

Solo `auth.ts`, `insforge-auth.ts` y `management-api.ts` dependen de cookies de
Astro o de `APIContext`. Antes de reescribirlos, leer `../PORTING.md`.

---

**Ver también:** `../decisions/manifest.json` (familias y estados) ·
`../adr/` (registros de decisión) · `../risks/` (deriva de dependencias) ·
`../program/` (cómo opera esto entre departamentos)
