# AGENTS.md

Empresa Plana (CA) website. Screens are designed in **Google Stitch** (project
`Dashboard Empresa Plana`, design system **"Empresa Plana - Branding"**) and
exported as HTML into `stitch-export/`, then transformed into Astro pages.

## Stack

- Astro 7 + `@astrojs/node` adapter + `@astrojs/vue` (islands), targeting InsForge Compute
- Package manager: **bun** (`bun.lock` present)
- Node >= 22.12
- Database: **InsForge** (Postgres, proyecto `empresaplana.cat`) via
  **Prisma 7** (`prisma-client` generator, output `generated/prisma/`) +
  `@prisma/adapter-pg` + `pg`. Validation with **zod v4**, native authentication
  with **@insforge/sdk** SSR helpers. Credentials in `.env` (`DATABASE_URL`,
  `INSFORGE_URL`, `INSFORGE_ANON_KEY`, optional canonical `APP_URL`).
- Styling: **Tailwind CSS v4 build-time** via `@tailwindcss/vite` (no CDN) +
  Geist + Material Symbols. Theme lives in `src/styles/global.css` (`@theme`
  block mirroring `src/assets/DESIGN.md`; brand colors exposed as CSS custom
  properties in `:root`).

## Commands

Run everything from this directory:

- `bun install`
- `bun run dev` — dev server on port 4321
- `bun run build` — runs all automatic checks before building `dist/`; a failed
  check or test blocks `astro build`. Docker uses the same gate.
- `bun run preview` — serves the production build
- `bun run start` — runs the standalone Node server from `dist/server/entry.mjs`
- `bun run format` / `bun run check:fix` — apply safe Biome fixes, including import ordering.
- `bun run check` — check Biome formatting, imports and lint without changing files.
- `bun run typecheck` — run Astro's TypeScript checks.
- `bun run test:unit` — run Bun unit tests in `tests/`, excluding integration tests.
- `bun run test:e2e` — run Playwright tests from `test/e2e/` in desktop and mobile
  Chromium. Install the browser once with `bunx playwright install chromium`.
  Dedicated servers use ports 4400/4401 and stop when tests finish. The test server
  uses `--ignore-lock` without stopping the user's dev server on port 4321.
  Auth configuration uses a local fixture; login rejection is mocked in the browser.
  These tests do not verify real Google/GitHub login or authenticated database CRUD.
  Failure screenshots/traces go to `test/test-results/`; HTML reports to
  `test/playwright-report/`. Generated reports are excluded from type checking.
- `bun run test:integration` — run live InsForge CRUD tests separately, with
  `CRUD_TEST_BASE_URL` and verified admin/worker test credentials configured.
- `bun run test` — run Biome, Astro checks, unit tests and E2E in sequence.
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
  InsForge Auth manages identities, credentials and OAuth.
- Deploy with `npx -y @insforge/cli compute deploy . --name empresaplana-web --port 8080
  --region fra --env-file <private-production-env-file>`. Source deployment requires
  `flyctl` on PATH; InsForge supplies its credentials. Do not deploy using your own Fly account.
  `Dockerfile` builds with Bun and runs standalone Node as a non-root user.
  `.dockerignore` allows only build inputs, excluding local credentials and agent configuration.
  Supply `DATABASE_URL`, `INSFORGE_URL`, `INSFORGE_ANON_KEY`, `APP_URL` and optional AI secrets
  at runtime.
  Local tracking JSON and Astro filesystem sessions are ephemeral across container replacement;
  do not treat them as durable storage. Native auth sessions are managed by InsForge.
  The service runs in Frankfurt with 512 MB RAM and scales to zero when idle.
  Spanish (`DEFAULT_LOCALE`) is served WITHOUT prefix: `/`, `/rutas-horarios`,
  `/dashboard/login`, `/perfil` (middleware rewrites internally to `/es/...`).
  Other locales keep their prefix: `/ca`, `/en`, `/fr`. `/es/...` redirects 308 to
  the unprefixed URL; `?lang=xx` on an unprefixed URL redirects 308 to that locale.
  APIs remain unprefixed at `/api/*`. Build links with `localizedPath()`.
  Use `localizedPath()` from `src/config/i18n/routing.ts` for navigation and redirects.
  Read `Astro.params.lang`, not a query parameter, for the page language.
  InsForge CLI domain attachment targets frontend deployments, not Compute services;
  do not attach a Compute hostname through the frontend/Vercel domain workflow.
- `security: { checkOrigin: false }` — the API endpoints are consumed by
  non-browser clients (no `Origin` header). CSRF is mitigated by the session
  cookie's `sameSite: "lax"` (browsers don't send it on cross-site POSTs).
- `security.allowedDomains` explicitly trusts local development hosts and the
  two production hosts for SSR request origins. Astro 7 otherwise rewrites
  untrusted hosts to localhost, breaking same-origin API checks and OAuth URLs.
- All pages declare `export const prerender = false;` (redundant but explicit
  in server mode). The `BusTrackingPanel` Vue
  island (`client:load`).
- Header preferences use KatanaKit's framework-independent theme service with
  `ep-theme` storage, light/dark/system modes and prepaint initialization.
  Use `HeaderPreferences` once per header; do not duplicate mobile language lists.
  Dark surface/text tokens live in `src/styles/global.css`, not per-page styles.
- Client-side prefetching is enabled (`prefetch: { prefetchAll: true }`).

## Design system

Canonical tokens live in `DESIGN.md` at the repo root (mirror of the Stitch
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
- `src/config/i18n/` — all site copy in `es.json` / `en.json` / `ca.json` /
  `fr.json` (1040 leaf keys each, verified identical in shape). Spanish is the
  default locale. Includes pages, about, full legal
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
- Fleet operations (ported from the Bolt prototype, migration
  `20261010130218_fleet-operations`): `VehicleDocument` (ITV, insurance,
  tachograph… with `expiresOn`), `Incident` and `Maintenance`, linked to
  `Bus`/`Driver` with `ON DELETE RESTRICT`, CHECK enums and server-only RLS.
  Managed in the dashboard CRUD as `documentos`, `incidencias` and
  `mantenimiento`; `/dashboard/gestion` shows KPIs and documents expiring
  within 30 days (`EXPIRY_WARNING_DAYS`). Demo rows are tagged `[DEMO]`.
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
  Demo profiles have no passwords or native identities. Native auth accounts
  are created through registration/OAuth, never fabricated by this seed.

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

## Management CRUD

- `/[lang]/dashboard/gestion/{rutas,autobuses,paradas,horarios,conductores,
  notificaciones,reportes,oficinas,presupuestos,lineas,horarios-linea,conexiones,
  documentos,incidencias,mantenimiento}`
  reads live InsForge data with search, pagination, detail, create, edit and
  confirmed deletion. No browser-local demo store is used.
- `src/lib/management-schemas.ts` owns zod validation, field metadata and
  capability selection. `src/lib/management.ts` provides typed Prisma adapters,
  reference validation and serializable writes.
- `/api/management/[resource]`: GET (page/limit/q), POST. The `[id]` endpoint
  supports GET, PATCH and DELETE. APIs remain unprefixed. Managers can read;
  mutations follow existing capabilities (currently admin only).
- Deletion refuses linked records instead of cascading or silently removing
  assignments. Connection stops must exist on both lines, and edits cannot
  remove the last timetable containing a connected stop.
- Fleet routes/schedules are separate from public search lines/schedules.
  Search timetable origin, destination, departure, arrival and duration are
  derived from ordered stop JSON. Times currently cover a single calendar day.
  Google Sheets sync overwrites these search tables; preserve edits in Sheets.
- `CRUD_TEST_BASE_URL=http://127.0.0.1:4322 bun test tests/management.integration.test.ts`
  exercises all fifteen entities against a local running server and InsForge,
  creating only isolated test records and deleting them afterwards. Optional
  `CRUD_TEST_EMAIL`/`CRUD_TEST_PASSWORD` and `CRUD_TEST_WORKER_EMAIL`/
  `CRUD_TEST_WORKER_PASSWORD` must identify verified native test accounts with
  the corresponding application roles. No legacy login defaults remain.
  Never run against a production URL.

## Auth & users

- Native verification/reset emails use InsForge-managed delivery (custom SMTP
  disabled by user choice in `insforge.toml`). Resend is development-only:
  `src/lib/email.ts` refuses to run when `NODE_ENV=production`, and the deploy
  script does not ship `RESEND_API_KEY`/`AUTH_EMAIL_FROM`. Use
  `bun run email:test` to send a test and `bun run email:manage list|get|
  cancel|share` to inspect sent emails (Resend "manage emails" API).
- `src/lib/insforge-auth.ts` adapts Astro cookies to InsForge SSR actions.
  Both access and refresh cookies are httpOnly because app operations are
  server-mediated. Middleware refreshes sessions; `src/lib/auth.ts` validates
  identities remotely and resolves application roles by `User.insforgeId`.
- `src/lib/validation/users.ts` — zod v4 schemas (create/update profiles);
  errors map to `{ error, issues }`. Unique conflicts are pre-checked →
  `{ error: "conflict", field }` 409.
- API: `POST /api/auth/login|logout`, `GET /api/auth/me`, `GET|POST
  /api/users` (admin), `GET|PATCH|DELETE /api/users/[id]` (admin; can't
  delete yourself). Profile CRUD does not create native credentials.
- Roles are `client`, `worker`, `manager`, and `admin`. Only managers and
  admins may access `/dashboard`; only admins may manage team roles or open
  integrations. Server middleware enforces these restrictions.
- Public registration always creates a `client`. Signed-in users manage only
  their own profile at `/perfil`; admins promote team members through
  `/dashboard/gestion/usuarios`. This admin-only role assignment is a product
  assumption until explicitly changed.
- New passwords must be 12–128 characters. No local password/JWT login exists.
  `/perfil` edits application name/phone and links to native recovery;
  linked identity emails cannot be edited as application-only fields.
- Google/GitHub provider callbacks point to
  `{INSFORGE_URL}/api/auth/oauth/{provider}/callback`. The app exchanges
  `insforge_code` with a server-owned PKCE verifier at `/api/auth/exchange`.
  Native auth config is in `insforge.toml`; external provider console changes
  are separate. Never auto-link a privileged profile by verified email.
- `migrations/20261010112209_insforge-auth-native.sql` removes obsolete auth
  tables and adds the unique native identity mapping. Validate on an isolated
  backend branch and coordinate promotion with deployment of the new code.

## Bus tracking (Glovo-style)

- `src/components/BusTrackingPanel.vue` — Vue island (`client:load`) with
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

- `/dashboard/ia` provides text generation for managers/admins using native Auth
  and the application session guard. InsForge supplies `OPENROUTER_API_KEY`;
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
- `AGENTS.md` / `DESIGN.md` / `PRODUCT.md` live at the repo root of this
  project; do not nest another git repo here (`.git` already exists at root).
- Never commit `.env` (copy from `.env.example` when needed).

## Regenerating pages from Stitch

Stitch exports are not kept in this repository. To regenerate a screen, export
the updated HTML/PNG from Stitch into a scratch directory outside the repo, then:

1. Transform each HTML: strip `<head>`, keep `<body>` inner content, then wrap
   in `BaseLayout` with `export const prerender = false;`.
2. Run `bun run build` and verify all routes.

## Releases

`bun run release:check` fails when `package.json`, the latest git tag and
`CHANGELOG.md` disagree, so the version in `package.json` cannot silently drift.
`bun run release:version -- --to 0.4.0` syncs the manifest, tag and changelog.
See `docs/RELEASING.md`.

## Portability

The domain core is framework-independent. `prisma/schema.prisma`, the migrations,
`src/config/i18n/*.json`, `src/styles/global.css` and 13 of the 16 `src/lib`
modules import nothing from Astro and port to any stack unchanged.

Only three core modules are coupled: `auth.ts`, `insforge-auth.ts` and
`management-api.ts` (Astro cookies and `APIContext`).

Before rewriting any of them, read `docs/PORTING.md`. It records the layer map,
the security and data-integrity invariants that must survive a rewrite, and the
route mapping. Do not port from `CHANGELOG.md` — its `[1.0.0]` section describes
a release with no tag behind it.

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
