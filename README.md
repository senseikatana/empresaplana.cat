# empresaplana-astro

Standalone Astro implementation of the Empresa Plana website and dashboard.
The public homepage follows the current service priorities: route search,
popular timetable downloads, airport transfers, and coach hire.

## Stack

- Astro with the Node standalone adapter and React islands
- TypeScript, Tailwind CSS v4, and Bun
- Prisma 7 with PostgreSQL via `@prisma/adapter-pg`
- Better Auth OAuth with Google/GitHub, `jose` app sessions, scrypt password
  hashes, and Zod validation
- Catalan, Spanish, English, and French interface dictionaries

## Requirements

- Node.js 22.12 or newer
- Bun
- PostgreSQL connection details for database-backed features

## Setup

```sh
cp .env.example .env
# Set DATABASE_URL and AUTH_SECRET in .env.
# OAuth credentials are optional locally; configure Google/GitHub to enable
# those sign-in buttons. Set BETTER_AUTH_URL to the canonical app origin.
bun install
bun run db:generate
bun run dev
```

The development site runs at `http://localhost:4321`.

To enable Google and GitHub sign-in, set `GOOGLE_CLIENT_ID`,
`GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, and `GITHUB_CLIENT_SECRET`. Register
these callback URLs with the providers:

- `http://localhost:4321/api/auth/callback/google`
- `http://localhost:4321/api/auth/callback/github`

For production, replace `BETTER_AUTH_URL` with the canonical HTTPS origin and
register the matching callback URLs. Then apply the added authentication
tables and nullable password field to the configured PostgreSQL database with
`bun run db:push`. Social sign-up creates client accounts; existing users are
matched only when the provider confirms the email as verified.

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

## Accounts and access

The public navigation links to login and registration. Self-registration
creates a client account, which can view and update its own profile at
`/perfil`; administrators and managers are routed to the private company
dashboard. Only administrators can assign roles or access user and integration
management. These restrictions are enforced by server middleware and APIs,
not just by the navigation UI.

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
