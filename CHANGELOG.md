# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.6.1] - 2026-10-17

Highlights: fix: update CI workflow tests to allow X-Forwarded-Host and accept any su, plus 1 more change.

- [x] 🐛 fix: update CI workflow tests to allow X-Forwarded-Host and accept any su
  - `.dockerignore`
  - `astro.config.mjs`
  - `bun.lock`
  - `fly.toml`
  - `package.json`
  - `vercel.json`
- [x] 🐛 fix(acl): open the client and employee dashboards to their own role
  - `src/layouts/DashboardLayout.astro`
  - `src/lib/acl.ts`
  - `tests/acl.test.ts`
- [x] 🚀 feat(workflows): add app and index
- [x] 🚀 feat(adr): add action, actualDirs and addReport (#23)
- [x] 🤖 ci: validate pull requests with existing production build gate
- [x] 🧪 test: check locale dictionary parity

## [0.6.0] - 2026-10-17

Highlights: feat(workflows): add app and index.

- [x] 🚀 feat(workflows): add app and index
  - `.github/workflows/fly-deploy.yml`
  - `fly.toml`
  - `src/scripts/deploy-insforge.mjs`
  - `tests/translation-parity.test.ts`
- [x] 🚀 feat(adr): add action, actualDirs and addReport (#23)
- [x] 🤖 ci: validate pull requests with existing production build gate
- [x] 🧪 test: check locale dictionary parity
- [x] 🔹 Initial plan
- [x] 🔹 Initial plan

## [0.5.0] - 2026-10-17

Highlights: feat(adr): add action, actualDirs and addReport (#23), plus 4 more changes.

- [x] 🚀 feat(adr): add action, actualDirs and addReport (#23)
  - `.env.example`
  - `Dockerfile`
  - `docs/adr/ADR-0001-astro-con-render-en-servidor-y-adaptador-node-st.md`
  - `docs/adr/ADR-0002-google-sheets-es-la-fuente-de-verdad-de-paradas.md`
  - `docs/adr/ADR-0003-los-reportes-ciudadanos-persisten-en-postgres-no.md`
  - `docs/adr/ADR-0004-el-escalado-se-juzga-por-ventana-de-dia-de-servi.md`
  - `docs/adr/ADR-0005-sin-notificacion-automatica-por-correo-la-interf.md`
  - `docs/adr/ADR-0006-las-apis-de-reporte-son-publicas-por-diseno-con.md`
  - `docs/adr/ADR-0007-el-identificador-de-cliente-se-deriva-con-hmac-y.md`
  - `docs/adr/ADR-0008-el-dia-de-servicio-se-ancla-en-europe-madrid-con.md`
  - `docs/adr/ADR-0009-se-sirve-sin-prefijo-para-espanol-y-con-prefijo.md`
  - `docs/adr/ADR-0010-el-contrato-de-tiempo-real-es-gtfs-realtime-ning.md`
  - `docs/adr/ADR-0011-la-integracion-con-la-compania-es-por-fichero-xl.md`
  - `docs/adr/ADR-0012-un-unico-gate-de-verificacion-y-astro-build-qued.md`
  - `docs/adr/README.md`
  - `docs/architecture/README.md`
  - `docs/architecture/decisions/migration-mapping.md`
  - `docs/decisions/README.md`
  - `docs/decisions/manifest.json`
  - `docs/program/README.md`
  - `docs/reclamacion.md`
  - `docs/risks/README.md`
  - `migrations/20261017120000_tracking-persistence.sql`
  - `package.json`
  - `prisma.config.ts`
  - `prisma/migrations_path`
  - `prisma/schema.prisma`
  - `src/components/BusTrackingPanel.vue`
  - `src/components/ManagementPanel.astro`
  - `src/config/i18n/ca.json`
  - `src/config/i18n/en.json`
  - `src/config/i18n/es.json`
  - `src/config/i18n/fr.json`
  - `src/interfaces/bus-tracking.ts`
  - `src/interfaces/tracking-store.ts`
  - `src/lib/management-schemas.ts`
  - `src/lib/management.ts`
  - `src/lib/rate-limit.ts`
  - `src/lib/tracking-store.ts`
  - `src/pages/[lang]/rastreig.astro`
  - `src/pages/api/bus-tracking/punctuality.ts`
  - `src/pages/api/bus-tracking/reports.ts`
  - `src/pages/api/bus-tracking/reviews.ts`
  - `src/scripts/deploy-insforge.mjs`
  - `src/scripts/verify-migrations.mjs`
  - `tests/management.integration.test.ts`
  - `tests/management.test.ts`
- [x] 🤖 ci: validate pull requests with existing production build gate
  - `.github/workflows/ci.yml`
  - `.gitignore`
  - `AGENTS.md`
  - `docs/RELEASING.md`
  - `tests/ci-workflow.test.ts`
- [x] 🧪 test: check locale dictionary parity
  - `tests/translation-parity.test.ts`
- [x] 🔹 Initial plan
- [x] 🔹 Initial plan
- [x] 🐛 fix(release): restore package.json to 0.4.4 after downgrade commits

## [0.4.5] - 2026-10-10

Highlights: fix(release): restore package.json to 0.4.4 after downgrade commits, plus 2 more changes.

- [x] 🐛 fix(release): restore package.json to 0.4.4 after downgrade commits
  - `package.json`
- [x] 🐛 fix: update package version to 0.4.2 in package.json
  - `package.json`
- [x] 🐛 fix: bump version to 0.4.3 in package.json
  - `package.json`
- [x] 🐛 fix: enforce consistent versioning across package.json, git tags, and chang
- [x] 🐛 fix: update AGENTS.md documentation for releases
- [x] 🐛 fix: update husky and package.json for correct version

## [0.4.4] - 2026-10-10

Highlights: fix: enforce consistent versioning across package.json, git tags, and chang.

- [x] 🐛 fix: enforce consistent versioning across package.json, git tags, and chang
  - `.husky/pre-push`
  - `docs/RELEASING.md`
  - `src/scripts/release-versions.mjs`
- [x] 🐛 fix: update AGENTS.md documentation for releases
- [x] 🐛 fix: update husky and package.json for correct version
- [x] 🐛 fix(package): update package version to 0.4.0
- [x] 🐛 fix: update CI workflows and ignore files
- [x] 🐛 fix: update PORTING.md and package.json

## [0.4.3] - 2026-10-10

Highlights: fix: update husky and package.json for correct version, plus 1 more change.

- [x] 🐛 fix: update husky and package.json for correct version
  - `.husky/pre-push`
  - `package.json`
- [x] 🐛 fix(package): update package version to 0.4.0
  - `package.json`
- [x] 🐛 fix: update CI workflows and ignore files
- [x] 🐛 fix: update PORTING.md and package.json
- [x] 🚀 feat: add verify workflow and update AGENTS.md and docs/RELEASING.md
- [x] 🐛 fix: update CI workflows to use latest actions and tools

## [0.4.2] - 2026-10-10

Highlights: fix: update CI workflows and ignore files, plus 1 more change.

- [x] 🐛 fix: update CI workflows and ignore files
  - `.github/workflows/verify.yml`
  - `.gitignore`
  - `AGENTS.md`
  - `docs/RELEASING.md`
  - `package.json`
- [x] 🐛 fix: update PORTING.md and package.json
  - `docs/PORTING.md`
  - `package.json`
- [x] 🚀 feat: add verify workflow and update AGENTS.md and docs/RELEASING.md
- [x] 🐛 fix: update CI workflows to use latest actions and tools
- [x] 🚀 feat: configure ci with verify workflow
- [x] 🐛 fix: update release scripts and documentation to reflect strict versioning (#13)

## [0.4.1] - 2026-10-10

Highlights: feat: add verify workflow and update AGENTS.md and docs/RELEASING.md.

- [x] 🚀 feat: add verify workflow and update AGENTS.md and docs/RELEASING.md
  - `.github/workflows/verify.yml`
  - `AGENTS.md`
  - `docs/RELEASING.md`
- [x] 🐛 fix: update CI workflows to use latest actions and tools
- [x] 🚀 feat: configure ci with verify workflow
- [x] 🐛 fix: update release scripts and documentation to reflect strict versioning (#13)
- [x] 🚀 feat: update design tokens and management CRUD documentation
- [x] 🚀 feat: update package.json version to 0.1.0 (#11)

## [0.4.0] - 2026-10-10

Highlights: fix: update CI workflows to use latest actions and tools.

- [x] 🐛 fix: update CI workflows to use latest actions and tools
  - `.github/workflows/verify.yml`
  - `.husky/pre-commit`
  - `.husky/pre-push`
  - `package.json`
  - `test/playwright.config.ts`
- [x] 🚀 feat: configure ci with verify workflow
- [x] 🐛 fix: update release scripts and documentation to reflect strict versioning (#13)
- [x] 🚀 feat: update design tokens and management CRUD documentation
- [x] 🚀 feat: update package.json version to 0.1.0 (#11)
- [x] 🚀 feat: update file paths in AGENTS.md and tsconfig.json to include test dire

## [0.3.2] - 2026-10-10

Highlights: feat: configure ci with verify workflow and fix: update release scripts and documentation to reflect strict versioning (#13).

- [x] 🚀 feat: configure ci with verify workflow
  - `.github/workflows/verify.yml`
  - `.gitignore`
  - `.husky/commit-msg`
  - `.husky/post-checkout`
  - `.husky/post-merge`
  - `.husky/pre-commit`
  - `.husky/pre-push`
  - `.husky/prepare-commit-msg`
  - `AGENTS.md`
  - `README.md`
  - `docs/PORTING.md`
  - `docs/RELEASING.md`
  - `package.json`
  - `src/scripts/commit-guard.mjs`
- [x] 🐛 fix: update release scripts and documentation to reflect strict versioning (#13)
  - `AGENTS.md`
  - `README.md`
  - `docs/RELEASING.md`
  - `package.json`
  - `src/scripts/release-versions.mjs`
- [x] 🚀 feat: update design tokens and management CRUD documentation
- [x] 🚀 feat: update package.json version to 0.1.0 (#11)
- [x] 🚀 feat: update file paths in AGENTS.md and tsconfig.json to include test dire
- [x] 🐛 fix: remove fly.toml configuration

## [0.3.1] - 2026-10-10

Highlights: feat: update design tokens and management CRUD documentation, plus 1 more change.

- [x] 🚀 feat: update design tokens and management CRUD documentation
  - `AGENTS.md`
  - `README.md`
  - `docs/PORTING.md`
  - `docs/RELEASING.md`
  - `package.json`
  - `src/scripts/release-versions.mjs`
- [x] 🚀 feat: update package.json version to 0.1.0 (#11)
  - `package.json`
- [x] 🚀 feat: update file paths in AGENTS.md and tsconfig.json to include test dire
- [x] 🐛 fix: remove fly.toml configuration
- [x] 🚀 feat(.dockerignore): add cwd, errors and locale
- [x] 🐛 fix!: update package.json for astro and bun commands

## [0.3.0] - 2026-10-10

Highlights: feat: update file paths in AGENTS.md and tsconfig.json to include test dire and fix: remove fly.toml configuration, plus 5 more changes.

- [x] 🚀 feat: update file paths in AGENTS.md and tsconfig.json to include test dire
  - `.dockerignore`
  - `AGENTS.md`
  - `tsconfig.json`
- [x] 🐛 fix: remove fly.toml configuration
  - `fly.toml`
- [x] 🚀 feat(.dockerignore): add cwd, errors and locale
  - `.dockerignore`
  - `.gitignore`
  - `AGENTS.md`
  - `Dockerfile`
  - `biome.json`
  - `bun.lock`
  - `fly.toml`
  - `package.json`
  - `src/pages/[lang]/dashboard/gestion/[seccion].astro`
  - `test/e2e/site.spec.ts`
  - `test/fixtures/auth-server.mjs`
  - `test/playwright.config.ts`
  - `tests/ai.test.ts`
- [x] 🐛 fix!: update package.json for astro and bun commands
  - `AGENTS.md`
  - `astro.config.mjs`
  - `biome.json`
  - `package.json`
  - `prisma.config.ts`
  - `src/config/i18n/index.ts`
  - `src/interfaces/i18n.ts`
  - `src/lib/auth-request.ts`
  - `src/lib/auth.ts`
  - `src/lib/insforge-auth.ts`
  - `src/lib/management-api.ts`
  - `src/lib/management.ts`
  - `src/lib/search.ts`
  - `src/middleware/index.ts`
  - `src/pages/api/auth/exchange.ts`
  - `src/pages/api/auth/login.ts`
  - `src/pages/api/auth/logout.ts`
  - `src/pages/api/auth/me.ts`
  - `src/pages/api/auth/oauth.ts`
  - `src/pages/api/auth/refresh.ts`
  - `src/pages/api/auth/register.ts`
  - `src/pages/api/auth/reset.ts`
  - `src/pages/api/auth/verify.ts`
  - `src/pages/api/chat/index.ts`
  - `src/scripts/bootstrap-sheets.mjs`
  - `src/scripts/demo-sheets.mjs`
  - `src/scripts/deploy-insforge.mjs`
  - `src/scripts/export-sheets.mjs`
  - `src/scripts/lib/sheets-format.mjs`
  - `src/scripts/seed.mjs`
  - `src/scripts/sync-sheets.mjs`
  - `tests/ai.test.ts`
  - `tests/locale-routing.test.ts`
  - `tests/management.integration.test.ts`
  - `tests/management.test.ts`
  - `tests/site-info.test.ts`
- [x] 🐛 fix: locale prefix management for UI routes and redirects (#9)
  - `AGENTS.md`
  - `astro.config.mjs`
  - `package.json`
  - `src/components/auth/SocialAuthButtons.astro`
  - `src/config/i18n/routing.ts`
  - `src/config/site-info.ts`
  - `src/interfaces/i18n.ts`
  - `src/lib/ai.ts`
  - `src/lib/auth-request.ts`
  - `src/lib/auth.ts`
  - `src/lib/email.ts`
  - `src/lib/get-public-user.ts`
  - `src/lib/insforge-auth.ts`
  - `src/lib/management-schemas.ts`
  - `src/lib/management.ts`
  - `src/lib/search.ts`
  - `src/lib/validation/users.ts`
  - `src/middleware/index.ts`
  - `src/pages/[lang]/dashboard/ia.astro`
  - `src/pages/api/account.ts`
  - `src/pages/api/auth/exchange.ts`
  - `src/pages/api/auth/login.ts`
  - `src/pages/api/auth/logout.ts`
  - `src/pages/api/auth/oauth.ts`
  - `src/pages/api/auth/refresh.ts`
  - `src/pages/api/auth/register.ts`
  - `src/pages/api/auth/reset.ts`
  - `src/pages/api/auth/verify.ts`
  - `src/pages/api/budget.ts`
  - `src/pages/api/chat/index.ts`
  - `src/pages/api/users/[id].ts`
  - `src/scripts/manage-emails.ts`
  - `src/scripts/test-email.ts`
  - `tests/acl.test.ts`
  - `tests/locale-routing.test.ts`
  - `tsconfig.json`
- [x] 🐛 fix: locale prefix management for UI routes and redirects
  - `AGENTS.md`
  - `astro.config.mjs`
  - `package.json`
  - `src/components/auth/SocialAuthButtons.astro`
  - `src/config/i18n/routing.ts`
  - `src/config/site-info.ts`
  - `src/interfaces/i18n.ts`
  - `src/lib/ai.ts`
  - `src/lib/auth-request.ts`
  - `src/lib/auth.ts`
  - `src/lib/email.ts`
  - `src/lib/get-public-user.ts`
  - `src/lib/insforge-auth.ts`
  - `src/lib/management-schemas.ts`
  - `src/lib/management.ts`
  - `src/lib/search.ts`
  - `src/lib/validation/users.ts`
  - `src/middleware/index.ts`
  - `src/pages/[lang]/dashboard/ia.astro`
  - `src/pages/api/account.ts`
  - `src/pages/api/auth/exchange.ts`
  - `src/pages/api/auth/login.ts`
  - `src/pages/api/auth/logout.ts`
  - `src/pages/api/auth/oauth.ts`
  - `src/pages/api/auth/refresh.ts`
  - `src/pages/api/auth/register.ts`
  - `src/pages/api/auth/reset.ts`
  - `src/pages/api/auth/verify.ts`
  - `src/pages/api/budget.ts`
  - `src/pages/api/chat/index.ts`
  - `src/pages/api/users/[id].ts`
  - `src/scripts/manage-emails.ts`
  - `src/scripts/test-email.ts`
  - `tests/acl.test.ts`
  - `tests/locale-routing.test.ts`
  - `tsconfig.json`
- [x] 🐛 fix: bump package version in package.json (#8)
  - `package.json`

## [0.2.3] - 2026-10-10

Highlights: feat: bump version to 0.1.0 in package.json.

- [x] 🚀 feat: bump version to 0.1.0 in package.json
  - `package.json`
- [x] 🚀 feat: update i18n config for fleet operations and miscellaneous translation
- [x] 🚀 feat: management-panel: add documents, incidents, and maintenance sections
- [x] 🚀 feat: adds fleet operations migration, including VehicleDocument, Incident, (#7)
- [x] 🚀 feat: native InsForge auth, Vue islands, theme/language menu, service alerts
- [x] 🐛 fix: cell rendering and management schemas

## [0.2.2] - 2026-10-10

Highlights: feat: update i18n config for fleet operations and miscellaneous translation.

- [x] 🚀 feat: update i18n config for fleet operations and miscellaneous translation
  - `AGENTS.md`
  - `package.json`
  - `src/config/i18n/ca.json`
  - `src/config/i18n/en.json`
  - `src/config/i18n/es.json`
  - `src/config/i18n/fr.json`
  - `tests/management.test.ts`
- [x] 🚀 feat: management-panel: add documents, incidents, and maintenance sections
- [x] 🚀 feat: adds fleet operations migration, including VehicleDocument, Incident, (#7)
- [x] 🚀 feat: native InsForge auth, Vue islands, theme/language menu, service alerts
- [x] 🐛 fix: cell rendering and management schemas
- [x] 🚀 feat: adds CRUD and Auth features to Management API and UI

## [0.2.1] - 2026-10-10

Highlights: feat: management-panel: add documents, incidents, and maintenance sections, plus 2 more changes.

- [x] 🚀 feat: management-panel: add documents, incidents, and maintenance sections
  - `src/components/ManagementPanel.astro`
  - `src/layouts/DashboardLayout.astro`
  - `src/lib/management.ts`
  - `src/pages/[lang]/dashboard/gestion/index.astro`
- [x] 🚀 feat: adds fleet operations migration, including VehicleDocument, Incident, (#7)
  - `migrations/20261010130218_fleet-operations.sql`
  - `prisma/schema.prisma`
  - `src/lib/management-schemas.ts`
- [x] 🚀 feat: native InsForge auth, Vue islands, theme/language menu, service alerts
  - `.env.example`
  - `AGENTS.md`
  - `README.md`
  - `astro.config.mjs`
  - `bun.lock`
  - `insforge.toml`
  - `migrations/20261010112209_insforge-auth-native.sql`
  - `migrations/20261010121912_create-service-alerts.sql`
  - `package.json`
  - `prisma/schema.prisma`
  - `prisma/seed.ts`
  - `src/components/BusTrackingPanel.tsx`
  - `src/components/BusTrackingPanel.vue`
  - `src/components/HeaderPreferences.astro`
  - `src/components/PublicHeader.astro`
  - `src/components/ThemeInit.astro`
  - `src/components/auth/SocialAuthButtons.astro`
  - `src/config/auth.config.ts`
  - `src/config/config.env.ts`
  - `src/config/i18n/ca.json`
  - `src/config/i18n/en.json`
  - `src/config/i18n/es.json`
  - `src/config/i18n/fr.json`
  - `src/env.d.ts`
  - `src/interfaces/bus-tracking.ts`
  - `src/interfaces/i18n.ts`
  - `src/layouts/BaseLayout.astro`
  - `src/layouts/DashboardLayout.astro`
  - `src/lib/auth-client.ts`
  - `src/lib/auth-request.ts`
  - `src/lib/auth.ts`
  - `src/lib/email.ts`
  - `src/lib/insforge-auth.ts`
  - `src/lib/oauth-users.ts`
  - `src/lib/passkey.ts`
  - `src/lib/validation/users.ts`
  - `src/middleware/index.ts`
  - `src/pages/[lang]/dashboard/login.astro`
  - `src/pages/[lang]/dashboard/register.astro`
  - `src/pages/[lang]/dashboard/reset.astro`
  - `src/pages/[lang]/dashboard/verify.astro`
  - `src/pages/[lang]/perfil.astro`
  - `src/pages/[lang]/rastreig.astro`
  - `src/pages/api/account.ts`
  - `src/pages/api/auth/[...all].ts`
  - `src/pages/api/auth/exchange.ts`
  - `src/pages/api/auth/login.ts`
  - `src/pages/api/auth/logout.ts`
  - `src/pages/api/auth/oauth.ts`
  - `src/pages/api/auth/refresh.ts`
  - `src/pages/api/auth/register.ts`
  - `src/pages/api/auth/reset.ts`
  - `src/pages/api/auth/verify.ts`
  - `src/pages/api/users/[id].ts`
  - `src/pages/api/users/index.ts`
  - `src/scripts/deploy-insforge.mjs`
  - `src/scripts/manage-emails.ts`
  - `src/scripts/seed-users.mjs`
  - `src/scripts/test-email.ts`
  - `src/styles/global.css`
  - `tests/management.integration.test.ts`
  - `tsconfig.json`
- [x] 🐛 fix: cell rendering and management schemas
- [x] 🚀 feat: adds CRUD and Auth features to Management API and UI
- [x] 🚀 feat: update configuration files for InsForge

## [0.2.0] - 2026-10-10

Highlights: feat: adds CRUD and Auth features to Management API and UI and fix: cell rendering and management schemas, plus 5 more changes.

- [x] 🐛 fix: cell rendering and management schemas
  - `src/components/ManagementPanel.astro`
  - `src/lib/management-schemas.ts`
  - `tests/management.integration.test.ts`
- [x] 🚀 feat: adds CRUD and Auth features to Management API and UI
  - `AGENTS.md`
  - `astro.config.mjs`
  - `src/components/ManagementPanel.astro`
  - `src/lib/management-api.ts`
  - `src/lib/management-schemas.ts`
  - `src/lib/management.ts`
  - `tests/management.integration.test.ts`
  - `tests/management.test.ts`
- [x] 🚀 feat: update configuration files for InsForge
  - `.dockerignore`
  - `.env.example`
  - `.gitignore`
  - `AGENTS.md`
  - `Dockerfile`
  - `package.json`
  - `src/components/ManagementPanel.astro`
  - `src/components/PublicHeader.astro`
  - `src/components/QuoteForm.astro`
  - `src/components/ServiceDetail.astro`
  - `src/components/auth/SocialAuthButtons.astro`
  - `src/config/i18n/ca.json`
  - `src/config/i18n/en.json`
  - `src/config/i18n/es.json`
  - `src/config/i18n/fr.json`
  - `src/config/i18n/index.ts`
  - `src/config/i18n/routing.ts`
  - `src/interfaces/i18n.ts`
  - `src/layouts/AuthLayout.astro`
  - `src/layouts/BaseLayout.astro`
  - `src/layouts/DashboardLayout.astro`
  - `src/lib/acl.ts`
  - `src/lib/email.ts`
  - `src/lib/management-api.ts`
  - `src/lib/management-schemas.ts`
  - `src/lib/management.ts`
  - `src/lib/validation/users.ts`
  - `src/middleware/index.ts`
  - `src/pages/[lang]/aviso-legal-variante.astro`
  - `src/pages/[lang]/aviso-legal.astro`
  - `src/pages/[lang]/dashboard/cliente/cotizaciones.astro`
  - `src/pages/[lang]/dashboard/cliente/cuenta.astro`
  - `src/pages/[lang]/dashboard/cliente/favoritas.astro`
  - `src/pages/[lang]/dashboard/cliente/index.astro`
  - `src/pages/[lang]/dashboard/gestion/[seccion].astro`
  - `src/pages/[lang]/dashboard/gestion/index.astro`
  - `src/pages/[lang]/dashboard/gestion/usuarios.astro`
  - `src/pages/[lang]/dashboard/ia.astro`
  - `src/pages/[lang]/dashboard/index.astro`
  - `src/pages/[lang]/dashboard/login.astro`
  - `src/pages/[lang]/dashboard/mensajes.astro`
  - `src/pages/[lang]/dashboard/register.astro`
  - `src/pages/[lang]/dashboard/trabajador/incidencias.astro`
  - `src/pages/[lang]/dashboard/trabajador/index.astro`
  - `src/pages/[lang]/dashboard/trabajador/lineas.astro`
  - `src/pages/[lang]/dashboard/trabajador/reportes.astro`
  - `src/pages/[lang]/donde-estamos-mobile-app.astro`
  - `src/pages/[lang]/donde-estamos-mobile.astro`
  - `src/pages/[lang]/donde-estamos-oficina-seleccionada.astro`
  - `src/pages/[lang]/donde-estamos.astro`
  - `src/pages/[lang]/home-variant-1.astro`
  - `src/pages/[lang]/home-variant-2.astro`
  - `src/pages/[lang]/index.astro`
  - `src/pages/[lang]/marketing-kit.astro`
  - `src/pages/[lang]/mobile.astro`
  - `src/pages/[lang]/perfil.astro`
  - `src/pages/[lang]/politica-cookies.astro`
  - `src/pages/[lang]/politica-privacidad.astro`
  - `src/pages/[lang]/rastreig.astro`
  - `src/pages/[lang]/rutas-horarios-mobile-app.astro`
  - `src/pages/[lang]/rutas-horarios-sin-resultados.astro`
  - `src/pages/[lang]/rutas-horarios.astro`
  - `src/pages/[lang]/screens.astro`
  - `src/pages/[lang]/servicios-discrecionales-mobile-app.astro`
  - `src/pages/[lang]/servicios-discrecionales.astro`
  - `src/pages/[lang]/servicios/[slug].astro`
  - `src/pages/[lang]/solicitar-presupuesto.astro`
  - `src/pages/[lang]/solicitud-confirmada.astro`
  - `src/pages/api/auth/exchange.ts`
  - `src/pages/api/auth/login.ts`
  - `src/pages/api/auth/register.ts`
  - `src/pages/api/management/[resource]/[id].ts`
  - `src/pages/api/management/[resource]/index.ts`
  - `src/pages/aviso-legal-variante.astro`
  - `src/pages/aviso-legal.astro`
  - `src/pages/dashboard/cliente/cotizaciones.astro`
  - `src/pages/dashboard/cliente/cuenta.astro`
  - `src/pages/dashboard/cliente/favoritas.astro`
  - `src/pages/dashboard/cliente/index.astro`
  - `src/pages/dashboard/gestion/[seccion].astro`
  - `src/pages/dashboard/gestion/index.astro`
  - `src/pages/dashboard/gestion/usuarios.astro`
  - `src/pages/dashboard/ia.astro`
  - `src/pages/dashboard/index.astro`
  - `src/pages/dashboard/login.astro`
  - `src/pages/dashboard/mensajes.astro`
  - `src/pages/dashboard/register.astro`
  - `src/pages/dashboard/trabajador/incidencias.astro`
  - `src/pages/dashboard/trabajador/index.astro`
  - `src/pages/dashboard/trabajador/lineas.astro`
  - `src/pages/dashboard/trabajador/reportes.astro`
  - `src/pages/donde-estamos-mobile-app.astro`
  - `src/pages/donde-estamos-mobile.astro`
  - `src/pages/donde-estamos-oficina-seleccionada.astro`
  - `src/pages/donde-estamos.astro`
  - `src/pages/home-variant-1.astro`
  - `src/pages/home-variant-2.astro`
  - `src/pages/index.astro`
  - `src/pages/marketing-kit.astro`
  - `src/pages/mobile.astro`
  - `src/pages/perfil.astro`
  - `src/pages/politica-cookies.astro`
  - `src/pages/politica-privacidad.astro`
  - `src/pages/rastreig.astro`
  - `src/pages/rutas-horarios-mobile-app.astro`
  - `src/pages/rutas-horarios-sin-resultados.astro`
  - `src/pages/rutas-horarios.astro`
  - `src/pages/screens.astro`
  - `src/pages/servicios-discrecionales-mobile-app.astro`
  - `src/pages/servicios-discrecionales.astro`
  - `src/pages/servicios/[slug].astro`
  - `src/pages/solicitar-presupuesto.astro`
  - `src/pages/solicitud-confirmada.astro`
  - `src/scripts/deploy-insforge.mjs`
  - `src/scripts/test-email.ts`
  - `tests/acl.test.ts`
  - `tests/locale-routing.test.ts`
- [x] 🐛 fix(ai): type Bun fetch mocks and correct localized copy
  - `bun.lock`
  - `package.json`
  - `src/config/i18n/ca.json`
  - `src/config/i18n/es.json`
  - `src/config/i18n/fr.json`
  - `tests/ai.test.ts`
- [x] 🐛 fix(ai): type Bun fetch mocks and correct localized copy
  - `bun.lock`
  - `package.json`
  - `src/config/i18n/ca.json`
  - `src/config/i18n/es.json`
  - `src/config/i18n/fr.json`
  - `tests/ai.test.ts`
- [x] 🐛 fix: update environment variables and openai integration (#4)
  - `.env.example`
  - `AGENTS.md`
  - `biome.json`
  - `bun.lock`
  - `package.json`
  - `prisma/seed.ts`
  - `router.ts`
  - `src/config/config.env.ts`
  - `src/config/i18n/ca.json`
  - `src/config/i18n/en.json`
  - `src/config/i18n/es.json`
  - `src/config/i18n/fr.json`
  - `src/interfaces/i18n.ts`
  - `src/layouts/DashboardLayout.astro`
  - `src/lib/ai.ts`
  - `src/pages/dashboard/ia.astro`
  - `tests/ai.test.ts`
- [x] 🐛 fix(runtime): use Node for InsForge and Prisma
  - `AGENTS.md`
  - `astro.config.mjs`
  - `bun.lock`
  - `package.json`
  - `prisma/schema.prisma`
  - `src/lib/db.ts`
  - `src/pages/rutas-horarios.astro`
  - `wrangler.cloudflare.jsonc`

## [0.1.4] - 2026-10-10

Highlights: fix: deploy:cloudflare: deploy the Worker using wrangler.cloudflare.jsonc.

- [x] 🐛 fix: deploy:cloudflare: deploy the Worker using wrangler.cloudflare.jsonc
  - `.env.example`
  - `.gitignore`
  - `AGENTS.md`
  - `astro.config.mjs`
  - `bun.lock`
  - `migrations/20261010092222_initial-prisma-schema.sql`
  - `package.json`
  - `prisma/schema.prisma`
  - `src/components/auth/SocialAuthButtons.astro`
  - `src/config/auth.config.ts`
  - `src/config/config.env.ts`
  - `src/env.d.ts`
  - `src/lib/auth-client.ts`
  - `src/lib/email.ts`
  - `src/lib/oauth-users.ts`
  - `src/middleware/index.ts`
  - `src/pages/api/auth/[...all].ts`
  - `wrangler.cloudflare.jsonc`
- [x] ♻️ refactor(auth): centralize Better Auth configuration
- [x] 🐛 fix!: improve Better Auth for Google and GitHub OAuth
- [x] 🔹 bun add v1.4.3 (c6da4a4d3) feat: auth and i18n implemented
- [x] 🔹 bun add v1.4.3 (c6da4a4d3) feat: add PRODUCT.md and auth
- [x] 🚀 feat: refresh standalone Astro website

## [0.1.3] - 2026-10-10

Maintenance release with 1 change.

- [x] ♻️ refactor(auth): centralize Better Auth configuration
  - `.env.example`
  - `AGENTS.md`
  - `bun.lock`
  - `package.json`
  - `src/config/auth.config.ts`
  - `src/config/config.env.ts`
  - `src/lib/better-auth.ts`
  - `src/lib/oauth-env.ts`
  - `src/pages/api/auth/[...all].ts`
  - `src/pages/api/auth/exchange.ts`
  - `src/pages/api/auth/logout.ts`
  - `src/pages/dashboard/login.astro`
  - `src/pages/dashboard/register.astro`
- [x] 🐛 fix!: improve Better Auth for Google and GitHub OAuth
- [x] 🔹 bun add v1.4.3 (c6da4a4d3) feat: auth and i18n implemented
- [x] 🔹 bun add v1.4.3 (c6da4a4d3) feat: add PRODUCT.md and auth
- [x] 🚀 feat: refresh standalone Astro website
- [x] 🔹 bun add v1.4.2 (744846f84) feat: update documentation for agents

## [0.1.2] - 2026-10-10

Highlights: feat: refresh standalone Astro website and fix!: improve Better Auth for Google and GitHub OAuth, plus 2 more changes.

- [x] 🐛 fix!: improve Better Auth for Google and GitHub OAuth
  - `.env.example`
  - `AGENTS.md`
  - `README.md`
  - `bun.lock`
  - `package.json`
  - `prisma/schema.prisma`
  - `src/components/auth/SocialAuthButtons.astro`
  - `src/config/i18n/ca.json`
  - `src/config/i18n/en.json`
  - `src/config/i18n/es.json`
  - `src/config/i18n/fr.json`
  - `src/lib/better-auth.ts`
  - `src/lib/oauth-env.ts`
  - `src/lib/oauth-users.ts`
  - `src/lib/passkey.ts`
  - `src/pages/api/auth/[...all].ts`
  - `src/pages/api/auth/exchange.ts`
  - `src/pages/api/auth/logout.ts`
  - `src/pages/dashboard/login.astro`
  - `src/pages/dashboard/register.astro`
- [x] 🔹 bun add v1.4.3 (c6da4a4d3) feat: auth and i18n implemented
  - `AGENTS.md`
  - `PRODUCT.md`
  - `README.md`
  - `package.json`
  - `src/components/PublicHeader.astro`
  - `src/config/i18n/ca.json`
  - `src/config/i18n/en.json`
  - `src/config/i18n/es.json`
  - `src/config/i18n/fr.json`
  - `src/interfaces/common.ts`
  - `src/layouts/AuthLayout.astro`
  - `src/layouts/DashboardLayout.astro`
  - `src/lib/db.ts`
  - `src/lib/validation/users.ts`
  - `src/pages/api/account.ts`
  - `src/pages/api/auth/login.ts`
  - `src/pages/api/auth/register.ts`
  - `src/pages/api/users/[id].ts`
  - `src/pages/api/users/index.ts`
  - `src/pages/dashboard/gestion/usuarios.astro`
  - `src/pages/dashboard/index.astro`
  - `src/pages/dashboard/login.astro`
  - `src/pages/dashboard/register.astro`
  - `src/pages/index.astro`
  - `src/pages/perfil.astro`
  - `tests/acl.test.ts`
- [x] 🔹 bun add v1.4.3 (c6da4a4d3) feat: add PRODUCT.md and auth
  - `PRODUCT.md`
  - `package.json`
  - `src/interfaces/auth.ts`
  - `src/lib/acl.ts`
  - `src/lib/auth.ts`
  - `src/middleware/index.ts`
- [x] 🚀 feat: refresh standalone Astro website
  - `bun.lock`
  - `package.json`
  - `public/images/empresa-plana-fleet.jpg`
  - `src/interfaces/home.ts`
  - `src/interfaces/i18n.ts`
  - `src/lib/logger.ts`
  - `src/pages/api/auth/register.ts`
  - `src/pages/api/users/index.ts`
  - `src/pages/index.astro`
- [x] 🔹 bun add v1.4.2 (744846f84) feat: update documentation for agents

## [0.1.1] - 2026-10-10

What's news:

- [ ] bun add v1.4.2 (744846f84) feat: update documentation for agents
  - `.env.example`
  - `.gitignore`
  - `AGENTS.md`
  - `DESIGN.md`
  - `LICENSE`
  - `README.md`
  - `astro.config.mjs`
  - `biome.json`
  - `bun.lock`
  - `eslint.config.mjs`
  - `package.json`
  - `prisma.config.ts`
  - `prisma/schema.prisma`
  - `prisma/seed.ts`
  - `public/CNAME`
  - `public/database-structure.png`
  - `public/drivers_export.json`
  - `public/favicon.ico`
  - `public/favicon.svg`
  - `public/incidents_export.json`
  - `public/maintenance_export.json`
  - `public/manifest.webmanifest`
  - `public/profiles_export.json`
  - `public/robots.txt`
  - `public/routes_export.json`
  - `public/schedules_export.json`
  - `public/sw.js`
  - `public/tabla-app.xlsx`
  - `public/users_export.json`
  - `public/vehicles_export.json`
  - `router.ts`
  - `src/assets/astro.svg`
  - `src/assets/background.svg`
  - `src/components/BusTrackingPanel.tsx`
  - `src/components/LegalPolicy.astro`
  - `src/components/QuoteForm.astro`
  - `src/components/RouteAccordion.astro`
  - `src/components/ServiceDetail.astro`
  - `src/components/ThroughAccordion.astro`
  - `src/components/TownSelect.astro`
  - `src/components/TransferAccordion.astro`
  - `src/config/i18n/ca.json`
  - `src/config/i18n/en.json`
  - `src/config/i18n/es.json`
  - `src/config/i18n/fr.json`
  - `src/config/i18n/index.ts`
  - `src/config/site-info.ts`
  - `src/data/contact.json`
  - `src/data/contact.ts`
  - `src/data/index.ts`
  - `src/data/popular-lines.json`
  - `src/data/quote-form.json`
  - `src/data/services.json`
  - `src/data/stops.json`
  - `src/data/towns.ts`
  - `src/data/types.ts`
  - `src/env.d.ts`
  - `src/interfaces/about.ts`
  - `src/interfaces/auth.ts`
  - `src/interfaces/booking.ts`
  - `src/interfaces/bus-tracking.ts`
  - `src/interfaces/common.ts`
  - `src/interfaces/data.ts`
  - `src/interfaces/discretionary.ts`
  - `src/interfaces/home.ts`
  - `src/interfaces/i18n.ts`
  - `src/interfaces/index.ts`
  - `src/interfaces/layout.ts`
  - `src/interfaces/legal-page.ts`
  - `src/interfaces/legal.ts`
  - `src/interfaces/locations.ts`
  - `src/interfaces/mobile-app.ts`
  - `src/interfaces/routes.ts`
  - `src/interfaces/search.ts`
  - `src/interfaces/towns.ts`
  - `src/interfaces/tracking-store.ts`
  - `src/interfaces/types.ts`
  - `src/interfaces/users.ts`
  - `src/layouts/BaseLayout.astro`
  - `src/layouts/DashboardLayout.astro`
  - `src/lib/acl.ts`
  - `src/lib/auth.ts`
  - `src/lib/chat.ts`
  - `src/lib/db.ts`
  - `src/lib/get-public-user.ts`
  - `src/lib/logger.ts`
  - `src/lib/passkey.ts`
  - `src/lib/search.ts`
  - `src/lib/tracking-store.ts`
  - `src/lib/users.ts`
  - `src/lib/validation/users.ts`
  - `src/middleware/index.ts`
  - `src/pages/api/account.ts`
  - `src/pages/api/auth/login.ts`
  - `src/pages/api/auth/logout.ts`
  - `src/pages/api/auth/me.ts`
  - `src/pages/api/auth/register.ts`
  - `src/pages/api/budget.ts`
  - `src/pages/api/budgets.ts`
  - `src/pages/api/bus-tracking/reports.ts`
  - `src/pages/api/bus-tracking/reviews.ts`
  - `src/pages/api/chat/[id].ts`
  - `src/pages/api/chat/index.ts`
  - `src/pages/api/favorites.ts`
  - `src/pages/api/fleet/notifications.ts`
  - `src/pages/api/fleet/routes.ts`
  - `src/pages/api/fleet/summary.ts`
  - `src/pages/api/health.ts`
  - `src/pages/api/offices.ts`
  - `src/pages/api/users/[id].ts`
  - `src/pages/api/users/index.ts`
  - `src/pages/aviso-legal-variante.astro`
  - `src/pages/aviso-legal.astro`
  - `src/pages/dashboard/cliente/cotizaciones.astro`
  - `src/pages/dashboard/cliente/cuenta.astro`
  - `src/pages/dashboard/cliente/favoritas.astro`
  - `src/pages/dashboard/cliente/index.astro`
  - `src/pages/dashboard/gestion/[seccion].astro`
  - `src/pages/dashboard/gestion/index.astro`
  - `src/pages/dashboard/index.astro`
  - `src/pages/dashboard/login.astro`
  - `src/pages/dashboard/mensajes.astro`
  - `src/pages/dashboard/register.astro`
  - `src/pages/dashboard/trabajador/incidencias.astro`
  - `src/pages/dashboard/trabajador/index.astro`
  - `src/pages/dashboard/trabajador/lineas.astro`
  - `src/pages/dashboard/trabajador/reportes.astro`
  - `src/pages/donde-estamos-mobile-app.astro`
  - `src/pages/donde-estamos-mobile.astro`
  - `src/pages/donde-estamos-oficina-seleccionada.astro`
  - `src/pages/donde-estamos.astro`
  - `src/pages/home-variant-1.astro`
  - `src/pages/home-variant-2.astro`
  - `src/pages/index.astro`
  - `src/pages/marketing-kit.astro`
  - `src/pages/mobile.astro`
  - `src/pages/politica-cookies.astro`
  - `src/pages/politica-privacidad.astro`
  - `src/pages/rastreig.astro`
  - `src/pages/rutas-horarios-mobile-app.astro`
  - `src/pages/rutas-horarios-sin-resultados.astro`
  - `src/pages/rutas-horarios.astro`
  - `src/pages/screens.astro`
  - `src/pages/servicios-discrecionales-mobile-app.astro`
  - `src/pages/servicios-discrecionales.astro`
  - `src/pages/servicios/[slug].astro`
  - `src/pages/solicitar-presupuesto.astro`
  - `src/pages/solicitud-confirmada.astro`
  - `src/scripts/bootstrap-sheets.mjs`
  - `src/scripts/demo-sheets.mjs`
  - `src/scripts/export-sheets.mjs`
  - `src/scripts/lib/db.mjs`
  - `src/scripts/lib/sheets-format.mjs`
  - `src/scripts/seed-users.mjs`
  - `src/scripts/seed.mjs`
  - `src/scripts/sync-sheets.mjs`
  - `src/styles/global.css`
  - `tsconfig.json`

