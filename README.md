# empresaplana-astro

Standalone Astro implementation of the Empresa Plana website and dashboard.
The public homepage follows the current service priorities: route search,
popular timetable downloads, airport transfers, and coach hire.

## Stack

- Astro with the Node standalone adapter and React islands
- TypeScript, Tailwind CSS v4, and Bun
- Prisma 7 with PostgreSQL via `@prisma/adapter-pg`
- `jose` session tokens, scrypt password hashes, and Zod validation
- Catalan, Spanish, English, and French interface dictionaries

## Requirements

- Node.js 22.12 or newer
- Bun
- PostgreSQL connection details for database-backed features

## Setup

```sh
cp .env.example .env
# Set DATABASE_URL and AUTH_SECRET in .env.
bun install
bun run db:generate
bun run dev
```

The development site runs at `http://localhost:4321`.

## Commands

| Command | Purpose |
| --- | --- |
| `bun run dev` | Start the Astro development server |
| `bun run build` | Build the Node server and client assets |
| `bun run preview` | Preview the production build |
| `bun run test` | Run Astro diagnostics |
| `bun run check` | Run Biome checks |
| `bun run db:generate` | Generate the Prisma client |
| `bun run db:migrate` | Create and apply a development migration |
| `bun run db:seed` | Seed development data |
| `bun run sync:sheets` | Sync route schedules from Google Sheets |

## Project layout

- `src/pages/` — public pages and dashboard routes
- `src/components/` — reusable Astro components and the React tracking island
- `src/config/i18n/` — translated interface content
- `src/data/` — contact details, services, and route timetable links
- `src/lib/` — authentication, database, search, and tracking helpers
- `prisma/` — PostgreSQL schema and seed data
- `DESIGN.md` — visual system and brand tokens

Never commit `.env`, database credentials, Google service-account keys, or
generated Prisma output.

## License

MIT © 2026 Sergio Jurado
