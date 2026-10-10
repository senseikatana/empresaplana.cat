# AGENTS.md

Empresa Plana (CA) website. Screens are designed in **Google Stitch** (project
`Dashboard Empresa Plana`, design system **"Empresa Plana - Branding"**) and
exported as HTML into `stitch-export/`, then transformed into Astro pages.

## Stack

- Astro 7 + `@astrojs/node` adapter + `@astrojs/react` (islands), targeting InsForge Compute
- Package manager: **bun** (`bun.lock` present)
- Node >= 22.12
- Database: **InsForge** (Postgres, proyecto `empresaplana.cat`) via
  **Prisma 7** (`prisma-client` generator, output `generated/prisma/`) +
  `@prisma/adapter-pg` + `pg`. Validation with **zod v4**, auth tokens with
  **jose** (HS256 JWT in an httpOnly cookie), plus **Better Auth** for Google
  and GitHub OAuth. Credentials in `.env` (`DATABASE_URL`, `AUTH_SECRET`,
  `BETTER_AUTH_URL`, and optional OAuth client secrets).
- Styling: **Tailwind CSS v4 build-time** via `@tailwindcss/vite` (no CDN) +
  Geist + Material Symbols. Theme lives in `src/styles/global.css` (`@theme`
  block mirroring `src/assets/DESIGN.md`; brand colors exposed as CSS custom
  properties in `:root`).

## Commands

Run everything from this directory:

- `bun install`
- `bun run dev` — dev server on port 4321
- `bun run build` — builds `dist/` (server entry + client assets)
- `bun run preview` — serves the production build
- `bun run start` — runs the standalone Node server from `dist/server/entry.mjs`
- `bun run deploy:insforge` — rebuilds and updates `empresaplana-web` in InsForge Compute.
  Requires the linked CLI project and `flyctl` (also detected in `~/.fly/bin`).
  Loads `.env.production`, `.env.local`, then `.env`, exporting only app runtime variables
  through a private temporary file that is removed afterward. It does not commit, push or seed.
  `INSFORGE_DEPLOY_URL` overrides the current fly.dev origin after custom-domain setup.
  `bun run deploy:insforge --dry-run` checks configuration without deploying or printing secrets.

## Rendering mode

- `astro.config.mjs` sets `output: "server"` with the Node adapter (`mode: "standalone"`).
  Astro 7 removed `output: "hybrid"`; `server` renders every route on request.
- The application runs in Node, including local development, so Prisma's
  Node query compiler is supported. Do not switch to Workers without generating
  a workerd-compatible Prisma Client; runtime WebAssembly compilation is blocked there.
- InsForge provides PostgreSQL and is the intended Compute destination.
  Better Auth manages application authentication; InsForge Auth is not used.
- Deploy with `npx -y @insforge/cli compute deploy . --name empresaplana-web --port 8080
  --region fra --env-file <private-production-env-file>`. Source deployment requires
  `flyctl` on PATH; InsForge supplies its credentials. Do not deploy using your own Fly account.
  `Dockerfile` builds with Bun and runs standalone Node as a non-root user.
  `.dockerignore` allows only build inputs, excluding local credentials and agent configuration.
  Supply `DATABASE_URL`, `AUTH_SECRET`, `BETTER_AUTH_URL` and optional provider/AI secrets
  at runtime. Set `WEBAUTHN_RP_ID` to the production hostname.
  Local tracking JSON and Astro filesystem sessions are ephemeral across container replacement;
  do not treat them as durable storage. Better Auth sessions remain in PostgreSQL.
  The service runs in Frankfurt with 512 MB RAM and scales to zero when idle.
  All UI routes use a locale prefix: `/es`, `/es/rutas-horarios`,
  `/es/dashboard/login`, `/es/perfil`. Supported prefixes are `ca`, `es`, `en`, `fr`.
  APIs remain unprefixed at `/api/*`. Unprefixed legacy UI URLs redirect with HTTP 308,
  preserving the requested query language (Catalan by default) and other query parameters.
  Use `localizedPath()` from `src/config/i18n/routing.ts` for navigation and redirects.
  Read `Astro.params.lang`, not a query parameter, for the page language.
  InsForge CLI domain attachment targets frontend deployments, not Compute services;
  do not attach a Compute hostname through the frontend/Vercel domain workflow.
- `security: { checkOrigin: false }` — the API endpoints are consumed by
  non-browser clients (no `Origin` header). CSRF is mitigated by the session
  cookie's `sameSite: "lax"` (browsers don't send it on cross-site POSTs).
- All pages declare `export const prerender = false;` (redundant but explicit
  in server mode). The only client-side code is the `BusTrackingPanel` React
  island (`client:load`).
- Client-side prefetching is enabled (`prefetch: { prefetchAll: true }`).

## Design system

Canonical tokens live in `src/assets/DESIGN.md` (mirror of the Stitch
"Empresa Plana - Branding" design system). Key facts:

- Brand colors: `deep-navy` `#013990`, `coastal-teal` `#13AEB8`,
  `energetic-orange` `#EB8E02` (CTAs only), background `#f8f9fa`.
- Font: Geist (400/600/700). Radius: `DEFAULT 0.25rem` / `lg 0.5rem` /
  `xl 0.75rem` / `full`. Ambient shadow `0px 4px 20px rgba(1,57,144,0.08)`.
- Spacing tokens: `margin-desktop 48px`, `margin-mobile 16px`, `gutter 24px`,
  `stack-sm/md/lg 8/16/32px`, `container-max 1280px`.

## Structure

- `src/layouts/BaseLayout.astro` — owns `<head>`, global build-time styles,
  the `<body>` wrapper and the shared `PublicHeader` (utility bar, navigation,
  languages and account actions). Public pages must not render their own site header.
  AuthLayout opts out with `publicHeader={false}` and supplies its own auth header;
  DashboardLayout remains independent. Language links preserve the current route.
- `src/pages/[lang]/*.astro` — one page per Stitch screen, prefixed by locale:
  `/rutas-horarios`, `/mobile`, `/donde-estamos`, `/home-variant-1`,
  `/donde-estamos-mobile`, `/home-variant-2`, `/servicios-discrecionales`,
  `/rastreig` (bus tracking demo), plus `/` (hub linking all screens).
- `stitch-export/` — raw exports from Stitch (HTML + PNG per screen). Use these
  as the source of truth when regenerating pages.
- `src/config/i18n/` — all site copy (ES/EN/CA) in `es.json` / `en.json` /
  `ca.json` (406 keys, identical shape). Includes pages, about, full legal
  texts (notice, cookies, privacy) and the bus-tracking UI, formerly scraped
  into `src/data/`.

## Database (InsForge + Prisma)

- `prisma/schema.prisma` — Prisma 7 schema: los 16 modelos compartidos con
  Nuxt (`User`, `Route`, `Stop`, `Schedule`, `Bus`, `Driver`, `Notification`,
  `Activity`, `Budget`, `Report`, `Office`, `FavoriteRoute`, `RecentSearch`,
  `Conversation`, `ConversationParticipant`, `Message`) más 3 tablas legacy
  de búsqueda de líneas: `Line` (id = id de la hoja), `SchedulesOnLine`
  (paradas denormalizadas en `stopsJson`) y `LineConnection` (encadenado
  mismo-bus: fromLineId → atStop → toLineId, waitMin default 0).
- `prisma.config.ts` — `dotenv/config` + `env("DATABASE_URL")`.
- `src/lib/db.ts` — singleton lazy `prisma()` con `PrismaPg` + `import
  "dotenv/config"` (Astro NO carga `.env` en `process.env` automáticamente).
- `src/lib/get-public-user.ts` — helper que devuelve `PublicUser` (cast de
  role incluido) para las páginas del dashboard.
- Seed: `bun run db:seed` (`prisma/seed.ts`) creates demo users.
  `bun run db:seed --demo` additionally loads fictional fleet, timetables,
  offices, budgets, favorites, reports and chat using non-destructive upserts.
  Demo records use negative IDs or `demo-` prefixes and visible DEMO labels.
  These schedules are not official and must not be used for travel.
  Auth sessions, verifications and organizations are created by Better Auth
  during normal use, not fabricated by the seed.

## Google Sheets sync

- Source of truth for line stops is a Google Sheets spreadsheet; Postgres
  (InsForge) stays the read model for the search. Template (see
  `sheets-export/` for a real dump):
  - Tab `LÍNEAS`: columns `id | nombre | pdf_url`.
  - One tab per line named `{id} - {nombre}`. Row 1 = stops as
    `{Población} — {Parada}`; each following row = one departure with
    `HH:MM` per stop (empty cells = express skips). origin/dest/duration are
    derived from first/last stop.
  - Tab `CONEXIONES`: columns `desde_linea | parada | hasta_linea | espera_min`
    — same-bus line chaining (e.g. `46 | Cambrils — Psg. d'Albert | 11 | 0`).
- Credentials in `.env`: `GOOGLE_SERVICE_ACCOUNT_JSON` (path to the service
  account key JSON, e.g. `sheets-credentials.json` — gitignored) +
  `GOOGLE_SPREADSHEET_ID`. Share the spreadsheet with the service account
  email (reader for sync, editor for bootstrap). The service account JWT
  (RS256) is signed with `jose` and exchanged for an OAuth token — no extra
  deps. GCP project: `steam-strategy-509408-s7`, SA `sheets-sync`.
- `bun run sync:sheets` (`src/scripts/sync-sheets.mjs`) — reads the
  spreadsheet (Sheets API `values`) and REPLACES `Line`/`SchedulesOnLine`/
  `LineConnection` in Postgres (idempotent; pg crudo, no ORM).
- `bun run export:sheets` (`src/scripts/export-sheets.mjs`) — dumps current
  Postgres data to `sheets-export/*.csv` in the exact template format (import
  into Google Sheets to bootstrap).
- `bun run bootstrap:sheets` (`src/scripts/bootstrap-sheets.mjs`) — writes
  the DB dump INTO a Google Spreadsheet (creates/renames tabs, clears values).
- Grid caveats: stops are per-line fixed (header); departures whose stops are
  a subset of the header survive; `lat`/`lon` are not carried through the
  sheet.

## Search & results

- `src/lib/search.ts` — `searchRoutes(origin, destination, withTransfers)`:
  accent-insensitive match of towns inside `stops_json` (order matters:
  origin must appear before destination). Returns per-line summaries
  (stops, departures capped at 24, first/last, PDF) + transfer options via
  shared hub towns (cap 6).
- "Same bus" journeys (`through`): reads `line_connections`; for each chain
  A→B at stop S, pairs departures where the A-schedule reaches S and the
  B-schedule leaves S within `max(wait_min, 10)` minutes. Origin must precede
  S on line A and S must precede destination on line B. Results show both
  legs, the connection stop and the aligned departure pairs.
- `/rutas-horarios` posts to itself (`#results` anchor) and renders
  `RouteAccordion` / `TransferAccordion` / `ThroughAccordion` components.
  Form defaults: Tarragona → Salou.

## Auth & users

- `src/lib/passkey.ts` — scrypt hashing (`salt:hash`, node:crypto, no deps).
- `src/lib/auth.ts` — JWT session via `jose` (HS256, `AUTH_SECRET`, 7d) in
  the `ep_session` httpOnly cookie; `authorize(cookies, role?)` guard returns
  a ready-made 401/403 `Response`.
- `src/lib/validation/users.ts` — zod v4 schemas (create/update/login);
  errors map to `{ error, issues }`. Unique conflicts are pre-checked →
  `{ error: "conflict", field }` 409.
- API: `POST /api/auth/login|logout`, `GET /api/auth/me`, `GET|POST
  /api/users` (admin), `GET|PATCH|DELETE /api/users/[id]` (admin; can't
  delete yourself). `passkey_hash` is never exposed.
- Roles are `client`, `worker`, `manager`, and `admin`. Only managers and
  admins may access `/dashboard`; only admins may manage team roles or open
  integrations. Server middleware enforces these restrictions.
- Public registration always creates a `client`. Signed-in users manage only
  their own profile at `/perfil`; admins promote team members through
  `/dashboard/gestion/usuarios`. This admin-only role assignment is a product
  assumption until explicitly changed.
- New and changed passwords must be 12–128 characters. Existing seeded
  development users (passkey `12345678`: `admin`, `trabajador`, `cliente`)
  remain able to log in for backwards-compatible local testing.
- Google and GitHub OAuth use `src/config/auth.config.ts` and environment
  values from `src/config/config.env.ts`, with separate
  `AuthUser`/`AuthSession`/`AuthAccount`/`AuthVerification` tables. Verified
  provider emails link to an existing application account; new social users
  receive the `client` role. OAuth sessions exchange into the app's existing
  `ep_session` cookie so existing ACLs continue to apply.

## Bus tracking (Glovo-style)

- `src/components/BusTrackingPanel.tsx` — React island (`client:load`) with
  report buttons (passed / on time / late / early / not passed / cancelled),
  escalation progress and a review (stars) form. Receives `t` (the
  `busTracking` dictionary) and `stops` from the page.
- Demo page: `/rastreig` (`src/pages/rastreig.astro`), linked from the hub.
- API (server-rendered, `prerender = false`):
  - `GET|POST /api/bus-tracking/reports` — submit/list stop reports.
  - `GET|POST /api/bus-tracking/reviews` — submit/list reviews.
- `src/lib/tracking-store.ts` — JSON file persistence (`.data/bus-tracking.json`,
  git-ignored; override path with `BUS_TRACKING_DATA_FILE`). Escalation: after
  `ESCALATION_THRESHOLD` (3) negative reports on a line, an escalation record
  is created (company + driver coordinator notified). Swap this store for
  Supabase when real persistence is needed.

## Gotchas

- `/dashboard/ia` provides text generation for managers/admins using Better Auth
  and the existing application session guard. InsForge supplies `OPENROUTER_API_KEY`;
  server-side OpenAI SDK calls use OpenRouter, never the deprecated InsForge AI SDK.
  Prompts are not stored and are sent to OpenRouter; do not include personal data.
  Requests cap input at 4000 characters and output at 800 tokens, with a 30-second
  per-user cooldown in each Node process (not a distributed quota).

- Design tokens live ONLY in `src/styles/global.css` (`@theme`) — add colors,
  spacing, fonts or text sizes there, never ad-hoc `bg-[#...]` values.
- `BaseLayout.astro` imports `../styles/global.css`; do not remove that import
  or styling breaks.
- `astro.config.mjs` must import from `astro/config` (not `astro/defineConfig`)
  and wire `tailwindcss()` from `@tailwindcss/vite` under `vite.plugins`.
- `AGENTS.md` / `DESIGN.md` / `stitch-export/` live at the repo root of this
  project; do not nest another git repo here (`.git` already exists at root).
- Never commit `.env` (copy from `.env.example` when needed).

## Regenerating pages from Stitch

1. Re-export the updated screen HTML/PNG into `stitch-export/`.
2. Transform each HTML: strip `<head>`, keep `<body>` inner content, then wrap
   in `BaseLayout` with `export const prerender = false;`.
3. Run `bun run build` and verify all routes.

<!-- INSFORGE:START -->
## InsForge backend

This project uses [InsForge](https://insforge.dev): an all-in-one, open-source Postgres-based backend (BaaS) that gives this app a database, authentication, file storage, edge functions, realtime, an AI model gateway, and payments through one platform.

- **Project:** **empresaplana-astro** (API base `https://gcmw58vt.eu-central.insforge.app`)
- **Skills:** these InsForge skills are installed for supported coding agents. Reach for them before implementing any InsForge feature instead of guessing the API:
  - `insforge`: app code with the `@insforge/sdk` client (database CRUD, auth, storage, edge functions, realtime, AI, email, and Stripe payments).
  - `insforge-cli`: backend and infrastructure via the `insforge` CLI (projects, SQL, migrations, RLS policies, storage buckets, functions, secrets, payment setup, schedules, deploys).
  - `insforge-debug`: diagnosing failures (SDK/HTTP errors, RLS denials, auth and OAuth issues) and running security or performance audits.
  - `insforge-integrations`: wiring external auth providers (Clerk, Auth0, WorkOS, Better Auth, etc.) for JWT-based RLS, or the OKX x402 payment facilitator.
  - `find-skills`: discovering additional skills on demand.
- **Credentials:** app code reads keys from `.env.local`; the CLI reads `.insforge/project.json`. Never hardcode or commit keys.

Key patterns:

- Database inserts take an array: `insert([{ ... }])`.
- Reference users with `auth.users(id)`; use `auth.uid()` in RLS policies.
- For storage uploads, persist both the returned `url` and `key`.
<!-- INSFORGE:END -->
