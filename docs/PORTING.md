# Porting Empresa Plana to another stack

This document is the portable artifact of the Astro implementation. Drop it into
another project as agent context: it explains what the product is, which layers
survive a framework change untouched, and which three modules must be rewritten.

It is deliberately self-contained. Nothing here depends on reading the Astro
source tree.

---

## 1. Domain briefing

Empresa Plana is a Catalan coach operator (`empresaplana.cat`). Two audiences
share one application:

- **Public site** — timetable and route search, PDF timetable downloads, airport
  transfers, coach hire, office locator, legal pages.
- **Private dashboard** — fleet operations, quote handling, crew management,
  internal messaging, AI-assisted copy.

### Data model

22 tables, in six groups:

| Group | Models | Notes |
| --- | --- | --- |
| Identity | `User`, `Conversation`, `ConversationParticipant`, `Message` | `User` links to the native auth identity by `User.insforgeId` only, never by email |
| Personal | `FavoriteRoute`, `RecentSearch` | per-user saved routes and search history |
| Commercial | `Route`, `Stop`, `Schedule`, `Budget`, `Office`, `Activity` | `Budget` is a customer quote, with a 7-value status lifecycle |
| Fleet | `Bus`, `Driver`, `Notification`, `Report` | `Report` is a service-delay log from a stop |
| Public search (legacy) | `Line`, `SchedulesOnLine`, `LineConnection` | denormalized stop JSON, see below |
| Fleet operations | `VehicleDocument`, `Incident`, `Maintenance` | all three `ON DELETE RESTRICT` |

Two modelling decisions are load-bearing and must survive any rewrite.

**1. The public search tables are a denormalized read model.**
`Line.id` is the spreadsheet row id. `SchedulesOnLine.stopsJson` holds an ordered
array of stops (`{ town, name, time, lat?, lon? }`) — the whole timetable for one
departure in one column. `LineConnection` encodes same-bus chaining:
`fromLineId → atStop → toLineId` with a `waitMin`.

Route search is therefore pure string and array logic over JSON, not relational
joins. Origins and destinations are matched accent-insensitively inside
`stops_json`, and **order matters**: the origin must appear before the
destination.

**2. Google Sheets is the source of truth for line stops.**
Postgres is the read model. `sync:sheets` **replaces** `Line`, `SchedulesOnLine`
and `LineConnection` wholesale, so it is idempotent but destructive: any edit made
directly in Postgres to those three tables is lost on the next sync. Preserve
edits in the spreadsheet.

### Search behaviour to reproduce

- Direct routes: accent-insensitive town match, origin before destination.
  Departures capped at 24 per line.
- Transfers: shared hub towns, capped at 6.
- "Same bus" (`through`): for each connection A→B at stop S, pair A-departures
  reaching S with B-departures leaving S within `max(waitMin, 10)` minutes.
  Origin must precede S on line A; S must precede destination on line B.
  The wait is a **forward gap**: `0 <= tB - tA <= window`. Do not use an absolute
  difference — that accepts connections where the second leg departed before the
  traveller arrived.
- Timetables cover a single calendar day.

### Fleet operations

`VehicleDocument` (ITV, insurance, tachograph, transport card, circulation
permit) carries `expiresOn`. The dashboard flags documents expiring within
`EXPIRY_WARNING_DAYS` (30). `Incident` has a severity/status lifecycle;
`Maintenance` has preventive/corrective kind plus cost.

### Roles

Four: `client`, `worker`, `manager`, `admin`.

- Public registration **always** creates a `client`.
- Only `manager` and `admin` may reach the dashboard.
- Only `admin` may mutate management resources or assign roles.
- Managers may read management resources but not write them.

Enforcement is server-side in middleware and API handlers, never in the
navigation UI.

### Locales

Four dictionaries: Catalan (`ca`), Spanish (`es`, the default), English (`en`),
French (`fr`). **1040 leaf keys each, verified identical in shape.**

Routing rule — easy to get wrong:

- The default locale is served **without a prefix**: `/`, `/rutas-horarios`,
  `/dashboard/login`, `/perfil`. The middleware rewrites internally to `/es/...`.
- Other locales keep their prefix: `/ca`, `/en`, `/fr`.
- `/es/...` issues a **308** redirect to the unprefixed URL.
- APIs are **never** prefixed.
- Build navigation with a single `localizedPath()` helper. Never hand-concatenate
  a locale prefix.

---

## 2. Layer map

| Layer | Coupling | Action on port |
| --- | --- | --- |
| `src/config/i18n/*.json` | none | copy verbatim |
| `prisma/schema.prisma` + `migrations/*.sql` | none | copy verbatim |
| `src/styles/global.css` (`@theme` block) | none | copy verbatim |
| `DESIGN.md` | none | copy verbatim |
| `src/lib/` — 13 of 16 modules | none | copy verbatim |
| `src/lib/` — 3 modules | Astro cookies / `APIContext` | rewrite, see §3 |
| `src/pages/api/**` (28 files) | `APIContext` | rewrite routing layer |
| `src/pages/[lang]/**`, layouts | Astro components | rewrite views |
| `.data/bus-tracking.json` | none | do not port, see §6 |

Tailwind v4 tokens live in a CSS `@theme` block, not in a JS config. That means
the design system ports to any Tailwind v4 host — Nuxt included — by copying one
file and importing it. There is no framework-specific theme object to rebuild.

### Copy verbatim (confirmed free of framework imports)

`prisma/schema.prisma`, all four `migrations/*.sql`, `DESIGN.md`,
`src/styles/global.css`, `src/config/i18n/{es,en,ca,fr}.json`, and these
`src/lib` modules: `management.ts`, `management-schemas.ts`, `search.ts`, `db.ts`,
`acl.ts`, `chat.ts`, `get-public-user.ts`, `tracking-store.ts`, `email.ts`,
`logger.ts`, `ai.ts`, `users.ts`, `auth-request.ts`.

---

## 3. The seam: three modules to rewrite

These are the only framework-coupled modules in the core. Everything else in
`src/lib` imports nothing but Prisma and zod.

### `auth.ts` — session resolution

Coupled through `Astro.cookies`. Exposes session lookup, role resolution by
`User.insforgeId`, and an `authorize(cookies, role?)` guard.

**Nuxt replacement:** swap the cookie adapter for `getCookie` / `setCookie` /
`deleteCookie` from `h3`. The module-level cache is keyed on the cookies object,
which is per-request in Astro — in Nuxt, key it on the `H3Event` or drop the
cache and accept the extra identity validation.

Keep the failure policy: an upstream auth failure **degrades to "no session"**,
it must not throw. Otherwise a 5xx from the auth backend takes down every public
page, since `BaseLayout` resolves a session on every render.

### `insforge-auth.ts` — cookie ↔ SSR action adapter

Bridges Astro's cookie API to the backend's server-side auth actions, for both
access and refresh tokens. Both cookies must stay `httpOnly`: all app operations
are server-mediated.

**Nuxt replacement:** identical logic, different cookie API. The `sameSite: "lax"`
attribute is load-bearing (see §5) and must be preserved.

### `management-api.ts` — the request handler

Coupled through `APIContext`. Owns the role gate, the capability check, resource
validation, the body-size limit and error mapping.

**Nuxt replacement:** `defineEventHandler` + `readBody`. Preserve the ordering —
validate the resource segment **before** computing its capability, so a capability
is never derived from an unvalidated path segment.

Two behaviours worth carrying over deliberately:

- **Body size limit must be enforced while streaming.** Buffering the body first
  and then measuring it provides no protection; a chunked request with no
  `Content-Length` bypasses a post-buffer check entirely.
- **Error mapping is a table, not a catch-all.** Validation failures, reference
  conflicts and dependency conflicts each map to a distinct status the UI depends
  on.

---

## 4. Route mapping

| Astro | Nuxt |
| --- | --- |
| `src/pages/api/**` | `server/api/**` (`defineEventHandler`) |
| `src/pages/[lang]/index.astro` | `pages/index.vue` (default locale, unprefixed) |
| `src/pages/[lang]/foo.astro` | `pages/[lang]/foo.vue` |
| `src/middleware/index.ts` | server middleware or a route guard |
| `src/layouts/*.astro` | `layouts/*.vue` |

Locale handling is the part to get right. In Astro the unprefixed default-locale
URL is a middleware rewrite onto `/es/...`, with a 308 back. In Nuxt, prefer
`defineI18nRouting` over reproducing the rewrite by hand — the redirect semantics
differ subtly and the rewrite approach is easy to get wrong.

---

## 5. Invariants that must not break

These are load-bearing. Each one exists because breaking it is a security or data
integrity failure, not a cosmetic one.

**Origin checking is disabled; cookies compensate.**
The API is consumed by non-browser clients that send no `Origin` header, so
`checkOrigin: false` is set. CSRF is mitigated **solely** by the session cookie's
`sameSite: "lax"`. Do not relax that attribute while keeping origin checks off —
that removes the only defense.

**Trusted origins must be listed explicitly.**
A list of development hosts and production hosts is trusted for SSR request
origins. Without it the framework rewrites untrusted hosts to `localhost`, which
breaks same-origin API checks and breaks OAuth return URLs.

**Mutations run in a serializable transaction.**
Read, validate references, and write happen inside one `Serializable`
transaction, and serialization failures map to a conflict response. Removing the
isolation level reintroduces a time-of-check/time-of-use race between the
reference check and the write.

**Deletion refuses instead of cascading.**
A record with dependents is rejected. It is never cascaded and never silently
stripped of assignments.

**Foreign keys use `ON DELETE RESTRICT`**, not cascade, across fleet operations.

**URL fields are schema-constrained.**
The timetable PDF field accepts only `http`/`https` URLs or empty — enforced in
the schema, and asserted by a test. The value is rendered as a raw link. Schema
validation is the only barrier, so any code path that writes that field must go
through the same schema.

**Sessions are server-mediated.** Both auth cookies are `httpOnly`.

**Text is escaped, never interpolated into HTML.**
Astro escapes by default; any framework port must preserve that default. Dynamic
DOM built from user-supplied text uses `textContent`, never `innerHTML`.

---

## 6. Do not port

**`.data/bus-tracking.json`.** A JSON file store for bus-tracking reports and
reviews, git-ignored, overridable via an env var. It is ephemeral by design and
does not survive container replacement. Replace it with real persistence before
relying on it. Its escalation rule (N negative reports on a line raises an
escalation) is worth keeping; the storage is not.

**Credentials and local state.** `.env`, Google service-account keys, generated
Prisma output, and local Astro session files.

**Search tables content.** Copy the schema, not the rows. Production rows come
from the spreadsheet sync, and the local copy is demo data.

---

## 7. Warning: do not trust this repository's CHANGELOG

Verified before writing this document:

- The latest git tag is **`v0.3.1`**, and `package.json` declares **`0.3.1`**. They
  agree, so the manifest is not lagging.
- `CHANGELOG.md` opens with a `## [1.0.0]` section describing a release that **has
  no corresponding tag or commits**. It is aspirational, not factual.
- `CHANGELOG.md` also contains 8 embedded ANSI **OSC 7** terminal escape sequences
  from a copy-paste (`ESC ] 7 ; file://... BEL`). All 8 are well-formed, but they
  leak a stale absolute local path into the file.

Treat the changelog's `[1.0.0]` section as fiction. The release tooling in
`src/scripts/` reads git tags rather than the changelog for exactly this reason:
the tag is the authority on what shipped, and a stray heading must not be able to
dictate the expected version.

`bun run release:check` fails when the manifest and the tag disagree, and warns
when the changelog disagrees. The warning does not fail the check on purpose,
because clearing it means either creating a tag or editing recorded history.

---

## 8. Suggested port order

1. Schema, migrations, i18n dictionaries, design tokens — all verbatim. Nothing
   to decide.
2. Session/auth layer — the three coupled modules in §3. Small, well-bounded,
   and everything else needs it.
3. Management CRUD — schemas and Prisma adapters are already portable; only the
   request handler changes.
4. Public search — `search.ts` ports unchanged; the views do not.
5. Public pages and dashboards last.