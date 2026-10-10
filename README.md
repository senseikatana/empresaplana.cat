# empresaplana-astro

Standalone Astro implementation of the Empresa Plana website and dashboard.
The public homepage follows the current service priorities: route search,
popular timetable downloads, airport transfers, and coach hire.

## Stack

- Astro with the Node standalone adapter and Vue islands
- TypeScript, Tailwind CSS v4, and Bun
- Prisma 7 with PostgreSQL via `@prisma/adapter-pg`
- Native InsForge Auth (email/password, Google/GitHub, server-owned cookies),
  Prisma application profiles and Zod validation
- KatanaKit light/dark/system themes and one responsive language dropdown
- Catalan, Spanish, English, and French interface dictionaries

## Requirements

- Node.js 22.12 or newer
- Bun
- PostgreSQL connection details for database-backed features

## Setup

```sh
cp .env.example .env
# Set DATABASE_URL, INSFORGE_URL and INSFORGE_ANON_KEY in .env.
# Native OAuth providers are configured in the InsForge dashboard.
bun install
bun run db:generate
bun run dev
```

The development site runs at `http://localhost:4321`.

OAuth callbacks in Google/GitHub must point to the InsForge backend:
`{INSFORGE_URL}/api/auth/oauth/google/callback` (or `github/callback`).
The app return is `{APP_URL}/api/auth/exchange`; leave `APP_URL` blank locally
to use the request origin. Allowed returns and native email delivery are managed
with `insforge.toml` through the InsForge CLI. Password recovery uses email codes.

Apply the native-auth SQL migration on an isolated InsForge branch before
promotion. It removes the obsolete auth tables and local passwords, preserving
business data. Do not promote it while an older application still depends on
those tables. Application profiles link only by `User.insforgeId`, never by email
to inherit privileged roles. New verified identities always start as clients.

## Commands

| Command | Purpose |
| --- | --- |
| `bun run dev` | Start the Astro development server |
| `bun run build` | Build the Node server and client assets |
| `bun run preview` | Preview the production build |
| `bun run test` | Run Astro diagnostics and Bun tests |
| `bun run check` | Run Biome checks |
| `bun run db:generate` | Generate the Prisma client |
| `bun run db:migrate` | Create and apply a development migration |
| `bun run db:seed` | Seed development data |
| `bun run sync:sheets` | Sync route schedules from Google Sheets |

## Accounts and access

The public navigation links to login and registration. Self-registration
creates a client account, which can view and update its own profile at
`/[lang]/perfil`; administrators and managers are routed to the private company
dashboard. Only administrators can assign roles or access user and integration
management. These restrictions are enforced by server middleware and APIs,
not just by the navigation UI.

Demo profiles do not have native login credentials. Admin-created application
profiles are not InsForge identities; use native registration/OAuth for sign-in
and promote the resulting profile in user management. Profile passwords are
changed through the native reset flow; identity emails are managed by InsForge.

## Project layout

- `src/pages/` — public pages and dashboard routes
- `src/components/` — reusable Astro components and the Vue tracking island
- `src/config/i18n/` — translated interface content
- `src/data/` — contact details, services, and route timetable links
- `src/lib/` — authentication, database, search, and tracking helpers
- `prisma/` — PostgreSQL schema and seed data
- `DESIGN.md` — visual system and brand tokens

Never commit `.env`, database credentials, Google service-account keys, or
generated Prisma output.

## License

MIT © 2026 Sergio Jurado
