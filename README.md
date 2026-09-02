# FleetOS

Fleet management and transport operations platform, built for a small
trucking business running 4 vehicles.

- **Phase 1** (technical foundation): database schema, multi-tenancy, RLS,
  auth, the GPS provider abstraction, the application shell.
- **Phase 2** (Command Center): the first real operational screen -- live
  fleet summary, map, vehicle list, active trips, evidence-based attention
  items, and a recent-activity timeline, all computed from the database.
- **Phase 3** (Vehicle Management): a full Vehicles list (search, composable
  filters, clickable summary cards) and a Vehicle Detail "dossier" -- 9 tabs
  covering overview, live tracking, trips, fuel, expenses, maintenance,
  documents, incidents, and full history -- plus Add/Edit Vehicle and
  driver-assignment workflows. Demo data is now anchored on an Ethiopian
  transport operation (Addis Ababa, Adama, Bishoftu, Hawassa, Mojo, Dire
  Dawa) instead of the placeholder US data Phases 1-2 shipped with.

Every other module (Finance beyond fuel/expenses, Compliance, Intelligence,
Issues beyond incidents, System) still renders an honest placeholder -- see
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

### Vehicle Management (Phase 3)

`src/app/(app)/vehicles/page.tsx` reuses the exact same `buildFleetBoard`/
`summarizeFleet` functions the Command Center uses (plus
`getCurrentAssignmentsByVehicle` and `getUpcomingMaintenanceByVehicle`) --
the fleet-wide summary cards, search, and composable filters
(`src/components/vehicles/vehicles-explorer.tsx`) are all client-side over
that one server fetch, table on desktop / cards on mobile via CSS
breakpoints, not a JS toggle.

`src/app/(app)/vehicles/[id]/page.tsx` is the vehicle "dossier": one
parallel data fetch (12 queries via `Promise.all`) feeding 9 tabs
(`src/components/vehicles/detail/*.tsx`) -- Overview, Live Tracking, Trips,
Fuel, Expenses, Maintenance, Documents, Incidents, History. Notable pieces:

- **Financial summary** (`src/lib/data/vehicle-finance.ts`) -- revenue is
  resolved through this vehicle's own trips (the schema scopes `revenues`
  to a trip, not a vehicle directly); every line is `null` (rendered "No
  data yet") rather than `0` when nothing's been recorded, so an unknown
  number is never confused with a known zero.
- **Fuel metrics** (`src/lib/data/fuel.ts`) -- cost/km only computes when
  at least two active transactions have distinct odometer readings;
  otherwise the tab shows "Insufficient data" rather than a guess.
- **Driver assignment** is a new table, `vehicle_driver_assignments`
  (`supabase/migrations/20260904080000_vehicle_driver_assignments.sql`) --
  append-only history distinct from "who's driving the current trip". A
  partial unique index (`where unassigned_at is null`) guarantees at most
  one *open* assignment per vehicle without a redundant "is_current" flag;
  reassigning closes the old row (`unassigned_at = now()`) rather than
  deleting it, and the existing Phase 1 audit trigger is attached the same
  way it is everywhere else.
- **History tab** (`src/lib/data/vehicle-history.ts`) merges three
  existing sources rather than introducing a new event-log table:
  `audit_logs` filtered to this vehicle (field-level edits, from the
  Phase 1 trigger), `recent_activity_feed` filtered by `vehicle_id`
  (trip/fuel/GPS/maintenance events, from Phase 2), and
  `vehicle_driver_assignments` (open/close events).
- **Permissions** (`src/lib/domain/permissions.ts`) -- reuses the
  existing `org_role` enum rather than a new system: `owner`/`admin`/
  `dispatcher` can add/edit vehicles and assign drivers, everyone else is
  view-only. Enforced in the UI (buttons hidden) and in every mutating
  Server Action (checked again server-side); **not yet in RLS itself** --
  see [Known limitations](#known-limitations-phase-3).
- Two small additive migrations round out fields the spec needed that
  Phase 1 had no use for yet: `vehicles.capacity_kg` /
  `vehicles.engine_number`, `vehicle_documents.document_number`, an
  organization-scoped unique constraint on `vehicles.license_plate`, and
  three more `expense_category` enum values (`parts`, `tires`,
  `driver_related` -- fuel already has its own table, so it's deliberately
  not one of them).

### Ethiopian demo data (Phase 3)

Phase 1/2 shipped with placeholder US data (Colorado plates, Denver-area
mock GPS, American driver names) that didn't match the business FleetOS is
actually being built for. That's now corrected -- **as a data change, not
an architecture change**: the same `mockGpsProvider` (`src/lib/gps/
providers/mock.ts`) now anchors its simulated routes on Addis Ababa instead
of Denver (one constant, `DEMO_METRO_AREA`), and every `raw_payload` it
produces is tagged `demo: true`. Seed data now reflects an Addis
Ababa-based fleet running the Addis Ababa-Adama-Bishoftu-Hawassa-Mojo-Dire
Dawa corridor, Ethiopian-style plates (`3-12345`), trucks actually common
in Ethiopian freight (Isuzu, Sinotruk, FAW), fictional Ethiopian driver
names, and Ethiopian Birr (`ETB`) as the transaction currency throughout.
None of this touches the schema, RLS, or the GPS abstraction -- see
`supabase/seed_phase3_ethiopia.sql`.

## What's deliberately not here

No CRUD for Finance beyond Fuel/Expenses, Compliance, Intelligence, or
Issues beyond Incidents, and no Trips module beyond what a vehicle's Trips
tab already shows (their nav routes, plus the quick-action routes --
`/trips/new`, `/finance/fuel/new`, `/finance/expenses/new`,
`/issues/incidents/new`, `/maintenance/new` -- render placeholders), no
non-mock GPS adapters, no Amharic/i18n UI (deliberately deferred, but the
token layer is ready for it -- see
[Language-neutral by design](#language-neutral-by-design)), no government/
regulatory integrations. The schema, RLS, and navigation route for every
deferred module already exist -- only the working screen is deferred.
Trip rows aren't clickable yet (no `/trips/[id]` route exists) -- linking
to one would be exactly the "fake functionality" this project avoids.

## Seeding

Demo data lives in `supabase/seed.sql` (Phase 1: one organization, 2 login
users, 4 vehicles, 4 drivers, 1 mock GPS connection, GPS events covering
live/delayed/offline, the 4th vehicle intentionally left without a device
to demonstrate "unknown") plus `supabase/seed_phase2.sql` (adds a 5th
driver, one active trip matching the spec's own worked example --
`TR-001`, unit 101, driver Abebe Kebede, Addis Ababa -> Hawassa,
`IN_TRANSIT` -- a near-expiry vehicle document and a near-due maintenance
schedule so "Attention Required" has real evidence, and fresh GPS events).
`supabase/seed_phase3_ethiopia.sql` then re-anchors that same data on
Ethiopia (renames drivers, restyles vehicles/plates, relocates GPS, adds
`TR-002`-`TR-005` across other Ethiopian corridors, fuel/expense/incident/
document records, and the 4 persistent driver assignments). All three
were applied directly against the Supabase project for this environment;
on a fresh project, run the migrations in `supabase/migrations/` in order,
then all three seed files in order (`seed.sql`, `seed_phase2.sql`,
`seed_phase3_ethiopia.sql`).

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

## Known limitations (Phase 3)

- **Role restrictions are app-layer only, not yet RLS.** `canManageFleet`
  gates the UI and every Server Action, but the underlying `vehicles`/
  `drivers` RLS policies (from Phase 1) still let any org member write --
  they were left as-is rather than risk rewriting tested Phase 1 policies
  under this phase's "don't break what works" constraint. Tightening RLS
  itself to match is a natural next step, not a redesign.
- **Trip/fuel/expense/incident "quick actions" are still placeholders.**
  Only Add/Edit Vehicle and Assign Driver got real forms this phase; Start
  Trip, Record Fuel, Report Issue, and Schedule Maintenance link to the
  existing (or newly added, for maintenance) placeholder routes with a
  `?vehicleId=` query param that isn't consumed by anything yet.
- **Trip rows aren't clickable.** No `/trips/[id]` page exists yet.
- **Vehicles list filters are client-side, not URL-persisted** -- they
  reset on refresh; not shareable/bookmarkable yet.
- **GPS still goes stale without a sync** -- same as Phase 2's limitation,
  unchanged by this phase.

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

**Phase 3 (additional):**
- `npm run build` -- clean, 37 routes including `/vehicles/[id]/edit`.
- `npx tsc --noEmit` and `npx eslint . --max-warnings=0` -- both clean.
- All 4 Phase 3 migrations (driver assignments table, vehicle
  capacity/engine number/plate constraint, expense category values,
  document number) applied to and verified against the live database, not
  just locally: confirmed the org-scoped unique plate constraint actually
  rejects a duplicate (wrapped in a `do $$ ... exception when
  unique_violation$$` probe), confirmed the partial unique index left
  exactly one open assignment per vehicle across all 4 vehicles, confirmed
  the Phase 1 audit trigger fired for real during the Ethiopia-data
  updates (9 real `audit_logs` rows: 4 vehicles + 5 drivers) -- meaning
  the History tab's audit source has genuine data, not just a code path.
- Verified live: the fleet-summary/list-status SQL equivalent currently
  produces one vehicle in each of ON_TRIP/AVAILABLE/MAINTENANCE/OFFLINE;
  vehicle 103's expense (30,500 ETB across 2 rows) and fuel
  (12,800 ETB) sums match what the Fuel/Expenses tabs and Financial
  Summary should show, while its `work_orders`-based maintenance cost and
  trip-linked revenue correctly resolve to no rows (verifying the "show
  nothing invented" path, not just the "show a number" path).
- Re-ran the security advisor after all Phase 3 migrations: no new
  findings beyond the pre-existing intentional ones.
- Re-ran the same route smoke test as Phase 2 (`next start`, direct HTTP)
  across old and new routes (`/`, `/login`, `/vehicles`, `/vehicles/new`,
  `/vehicles/[id]`, `/vehicles/[id]/edit`, `/maintenance/new`, `/drivers`)
  -- every protected route still correctly redirects unauthenticated
  visitors, `/login` still 200s: no regression to Phase 1/2 auth or
  routing.
- **Not verified** (same constraint as Phase 2): an authenticated browser
  session exercising search/filters, the Assign Driver dialog, or the
  Add/Edit Vehicle forms end-to-end. All of it was instead verified at the
  data layer (the queries and mutations were run directly against the live
  database as shown above); a real click-through pass from a normal
  network is the one remaining check for this phase too.
