# FleetOS

Fleet management and transport operations platform, built for a small
trucking business running 4 vehicles.

- **Phase 1** (technical foundation): database schema, multi-tenancy, RLS,
  auth, the GPS provider abstraction, the application shell.
- **Phase 2** (Command Center): the first real operational screen -- live
  fleet summary, map, vehicle list, active trips, evidence-based attention
  items, and a recent-activity timeline, all computed from the database.

Every other module (Trips, Finance, Compliance, Intelligence, Issues,
System) still renders an honest placeholder -- see
[What's deliberately not here](#whats-deliberately-not-here).

## Stack

- Next.js 16 (App Router, Turbopack) + React 19 + TypeScript (strict)
- Tailwind CSS v4 + hand-scaffolded shadcn/ui primitives (`src/components/ui`)
- Supabase: Postgres, Auth, Storage, Row Level Security
- Leaflet + OpenStreetMap tiles for the live fleet map (no API key required)

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in your Supabase project URL + anon key
npm run dev
```

## Deploying to Render

A `render.yaml` blueprint is included. Either "New > Blueprint" from this
repo, or create a Web Service manually with:

- **Runtime**: Node (`.node-version` pins Node 22)
- **Build command**: `npm ci && npm run build`
- **Start command**: `npm run start` (reads Render's `PORT` automatically)
- **Branch**: `claude/fleetos-technical-foundation-lsom04`
- **Environment variables** (Render dashboard -> Environment): copy the
  values from your local `.env.local` --
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and
  `NEXT_PUBLIC_SITE_URL` set to the Render-assigned URL once you have it
  (e.g. `https://fleetos.onrender.com`).

Demo login (seeded -- see [Seeding](#seeding)):

| Email | Password | Role |
|---|---|---|
| `owner@fleetos-demo.dev` | `FleetOS-Demo1!` | owner |
| `dispatch@fleetos-demo.dev` | `FleetOS-Demo1!` | dispatcher |

Change or delete these before any real deployment.

## Architecture

### Multi-tenancy

Every operational table has an `organization_id` and an RLS policy scoping
reads/writes to `organization_id = current_org_id()`, where `current_org_id()`
is a `security definer` SQL function resolving the caller's org from their
`profiles` row. There is currently one organization per Supabase project's
worth of demo data; the schema supports more, but there's no
organization-switcher UI yet since there's only ever one org to be in.

```
organizations -> profiles -> {vehicles, drivers, trips, deliveries,
  fuel_transactions, expenses, revenues, invoices, payments,
  maintenance_*, vendors, inspections, *_documents, incidents, disputes,
  gps_*, notifications, alerts, attachments, audit_logs}
```

See `supabase/migrations/` for the full schema (34 tables), applied in
order. Every table has: a UUID primary key, `created_at`/`updated_at`
timestamps (auto-maintained by a shared trigger), foreign keys with
sensible `on delete` behavior, and indexes on the columns it's actually
queried by.

### Auditability

Financial and evidentiary tables (`fuel_transactions`, `expenses`,
`revenues`, `invoices`, `payments`, `incidents`, `disputes`, `vehicles`,
`drivers`) are **never hard-deleted** -- there is no `DELETE` RLS policy on
any of them, and every `UPDATE`/`DELETE` is captured automatically in
`audit_logs` (actor, action, previous value, new value) via a shared
trigger. Corrections happen by changing `status` to `voided` / `corrected`
/ `superseded`, not by erasing the row.

`incident_evidence.kind` is the structural version of the product
principle "don't accuse, present evidence": every piece of evidence is
tagged `fact | calculation | user_input | interpretation | decision`, and
`alerts.kind` defaults to `calculation` -- an alert is FleetOS noticing a
number crossed a threshold, not an accusation.

### GPS provider abstraction

```
GPS Provider (gps_providers catalog: rest_api / webhook / mqtt / tcp_socket
  / sdk / csv_import / database / manual)
  -> Adapter (implements GpsProvider: src/lib/gps/types.ts)
    -> Normalized GPS Event (NormalizedGpsEvent, one shape for every vendor)
      -> gps_events (append-only) -> vehicle_locations (latest-position
         cache, kept in sync by a DB trigger)
        -> Application
```

`src/lib/gps/registry.ts` maps a provider slug to its adapter
implementation; swapping in a real vendor means writing one more file and
registering it there, nothing else changes. Only `mock` is implemented for
now (`src/lib/gps/providers/mock.ts`) -- a deterministic simulated feed,
one closed-loop route per device, seeded from the device id so re-running
it advances the same vehicle along the same route rather than teleporting
it.

**GPS status is never claimed live just because a vehicle exists.**
`src/lib/gps/status.ts` computes `LIVE | DELAYED | OFFLINE | UNKNOWN` from
how old the last fix actually is (≤5 min live, ≤20 min delayed, older is
offline, no fix ever recorded is unknown) -- see the seed data for one
vehicle in each state.

### Reusable data access pattern

`src/lib/data/*.ts` are the read pattern every module should follow:
accept a `SupabaseClient<Database>`, never accept an `organizationId`
parameter (RLS supplies that scoping), and throw on error rather than
return one. `src/lib/supabase/{client,server}.ts` are the two client
factories (browser / server-with-cookies); `src/proxy.ts` +
`src/lib/supabase/proxy.ts` refresh the session and redirect
unauthenticated visitors on every request (Next.js 16 renamed
`middleware.ts` to `proxy.ts` -- this project uses the new name).

### Application shell

`src/app/(app)/layout.tsx` loads the current profile + organization and
renders `AppShell` (`src/components/app-shell.tsx`): a desktop sidebar
that collapses to icon-only (persisted to `localStorage`, not the
database -- it's a per-device UI preference, not fleet data), a
`Sheet`-based drawer on mobile, a header with the current page title
(derived from the route, not stored), a notifications bell reading real
unread counts, and a quick-actions menu. Nav tree lives in `src/lib/nav.ts`
(Command Center, Operations, Fleet, Finance, Compliance, Intelligence,
Issues, System). Every route in that tree exists and resolves; most
render `PagePlaceholder` (`src/components/page-placeholder.tsx`) -- an
honest "not built yet" state rather than fabricated rows.

### Command Center (Phase 2)

`src/app/(app)/page.tsx` composes one data fetch (`src/lib/data/fleet.ts`,
`trips.ts`, `attention.ts`, `activity.ts`) into every section on the page
-- nothing re-queries what another section already fetched:

- **Fleet summary** -- Total / On Trip / Available / Maintenance / Offline
  / Active Trips, computed by `computeVehicleOperationalStatus`
  (`src/lib/domain/vehicle.ts`) from the vehicle's own status, whether it
  has an active trip, and its GPS status. Never stored, never hardcoded.
- **Live fleet map** (`src/components/fleet-map.tsx`) -- Leaflet +
  OpenStreetMap, plotting real `vehicle_locations`, colored by GPS status,
  click-to-summary popup. A vehicle with no fix simply isn't plotted (the
  vehicle list still shows it as "Unknown" -- the map never invents a
  position).
- **Vehicle operations list** and **active trips** both read from the
  same `getFleetBoard`/`getActiveTrips` functions the summary and map use
  -- one source of truth, never duplicated per screen.
- **Attention required** (`src/lib/data/attention.ts`) -- evidence, not
  accusations: a GPS gap ("Last signal 93 minutes ago"), a document's own
  expiry date, a maintenance schedule's own due date. Nothing here is
  free-text; every item traces back to a queryable fact.
- **Recent activity** reads `recent_activity_feed`, a `security_invoker`
  Postgres view unioning trip/fuel/GPS/maintenance events (see
  `supabase/migrations/20260903090100_recent_activity_view.sql`) --
  English descriptions are built in `src/lib/i18n/describe-activity.ts`
  from language-neutral event tokens, never stored pre-formatted.
- **Sync GPS** button (next to the map) runs one pull cycle of the mock
  provider on demand, since there's no scheduler yet to do it
  automatically -- see [Known limitations](#known-limitations-phase-2).

### Language-neutral by design

Every new enum and computed status introduced in Phase 2 uses
`UPPER_SNAKE_CASE` tokens (`trip_status`: `DRAFT`...`CANCELLED`; the
computed `VehicleOperationalStatus`: `ON_TRIP`/`AVAILABLE`/`MAINTENANCE`/
`OFFLINE`) and business logic compares against those tokens, never
against display strings. `src/lib/i18n/labels.ts` is the one place that
maps tokens to English text -- adding Amharic later means adding
`src/lib/i18n/am.ts` with the same keys and a locale resolver, not
touching any conditional in the app.

## What's deliberately not here

No CRUD for Trips/Finance/Maintenance/Compliance/Intelligence/Issues/System
modules (their nav routes, plus the 5 quick-action routes --
`/vehicles/new`, `/trips/new`, `/finance/fuel/new`, `/finance/expenses/new`,
`/issues/incidents/new` -- render placeholders), no non-mock GPS adapters,
no Amharic/i18n UI (deliberately deferred, but the token layer is ready
for it), no government/regulatory integrations. The schema, RLS, and
navigation route for every deferred module already exist -- only the
working screen is deferred.

## Seeding

Demo data lives in `supabase/seed.sql` (Phase 1: one organization, 2 login
users, 4 vehicles, 4 drivers, 1 mock GPS connection, GPS events covering
live/delayed/offline, the 4th vehicle intentionally left without a device
to demonstrate "unknown") plus `supabase/seed_phase2.sql` (adds a 5th
driver, one active trip matching the spec's own worked example --
`TR-001`, unit 101, driver Abebe Kebede, Addis Ababa -> Hawassa,
`IN_TRANSIT` -- a near-expiry vehicle document and a near-due maintenance
schedule so "Attention Required" has real evidence, and fresh GPS events).
Both were applied directly against the Supabase project for this
environment; on a fresh project, run the migrations in
`supabase/migrations/` in order, then both seed files.

## Known limitations (Phase 2)

- **GPS data goes stale without a scheduler.** The mock feed only
  advances when something calls `syncGpsConnection` (Phase 1's
  `POST /api/gps/sync`, or the "Sync GPS" button on the Command Center).
  There's no cron/queue running it automatically yet -- a vehicle seeded
  as LIVE will correctly (and honestly) become DELAYED then OFFLINE as
  real time passes until someone syncs again.
- **Driver assignment is trip-only.** A vehicle's "driver" is whoever is
  on its current active trip; there's no fixed vehicle-driver assignment
  concept, which matches how the schema was designed in Phase 1 but means
  a vehicle with no active trip always shows "Unassigned", never a
  default driver.
- **`auth_leaked_password_protection` is disabled** at the Supabase Auth
  platform level (flagged by the security advisor) -- a dashboard toggle
  (Authentication -> Policies), not something a migration can set; worth
  enabling before any real users sign up.

## Verification performed

**Phase 1:**
- `npm run build`, `npx tsc --noEmit`, `npx eslint .` -- all clean.
- All migrations applied to the live Supabase project; `list_tables`
  confirmed RLS enabled everywhere; every actionable security/performance
  advisor finding (unindexed foreign keys, RLS re-evaluating `auth.uid()`
  per row, overly-public `security definer` functions) was fixed.
- Seed data counts confirmed directly against the database; the
  `handle_new_user` trigger confirmed firing (2 auth users -> 2 profiles).
- `computeGpsStatus` exercised directly against the spec's own examples
  (2 min -> live, 15 min -> delayed, 60 min -> offline, no data ->
  unknown) -- all pass.

**Phase 2 (additional):**
- `npm run build` -- clean, 35 pages / 33 app routes, including the new
  `/vehicles/[id]` dynamic route and the 5 quick-action placeholders.
- `npx tsc --noEmit` and `npx eslint . --max-warnings=0` -- both clean.
- The `trip_status` enum swap, the `recent_activity_feed` view, and the
  Phase 2 seed data were all applied to and verified directly against the
  live database (not just locally) -- confirmed via direct SQL that:
  the fleet-summary logic's SQL equivalent produces one vehicle in each
  of ON_TRIP / AVAILABLE / MAINTENANCE / OFFLINE; the active-trips join
  returns exactly the worked example from the spec (`TR-001`, unit 101,
  Abebe Kebede, Addis Ababa -> Hawassa, IN_TRANSIT); the attention-item
  queries return the seeded near-expiry document and near-due maintenance
  schedule with correct day counts; `recent_activity_feed` returns rows
  for both the GPS and trip event types.
- Re-ran the security advisor after the Phase 2 migrations: no new
  findings beyond the pre-existing intentional ones (see
  [Known limitations](#known-limitations-phase-2) for the one platform
  setting it flagged).
- The app was started (`next start`) and hit directly over HTTP: every
  route -- old and new -- still correctly 307-redirects to
  `/login?next=<path>` when unauthenticated, confirming the Phase 1 auth
  guard and no route regressions; `/login` still renders 200.
- **Not verified**: an actual authenticated browser session against the
  Command Center -- this sandbox's egress policy blocks outbound HTTPS to
  `supabase.co` (confirmed via the proxy status endpoint), so the Auth API
  call a real sign-in makes cannot be exercised from here. Everything the
  Command Center's queries return was instead verified by running the
  equivalent SQL directly against the live database (see above). Signing
  in with the demo credentials from a normal network is the one
  remaining check.
