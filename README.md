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

### Trips, Dispatch & Deliveries (Phase 4)

The first real operational workflow module: trip creation through dispatch,
transit, arrival, delivery, and completion, plus the deliveries this
produces. Nothing here replaces Phase 1-3 architecture -- it's four small
additive migrations, a domain layer, a data layer, and pages built the same
way Vehicle Management was.

- **State machine, not a dropdown** (`src/lib/domain/trip.ts`,
  `src/lib/domain/delivery.ts`) -- `ALLOWED_TRANSITIONS` maps every status
  to the only statuses it's legal to move to next (`DRAFT` → `ASSIGNED` →
  `LOADING` → `DISPATCHED` → `IN_TRANSIT` → `ARRIVED` → `DELIVERED` →
  `COMPLETED`, with an explicit `CANCELLED` branch off every non-terminal
  status). `canTransition()`/`canTransitionDelivery()` is the single
  server-side gate (`transitionTripStatus`/`transitionDeliveryStatus` in
  `src/app/(app)/trips/actions.ts` and `.../deliveries/actions.ts`) --
  every caller (Dispatch board buttons, Trip/Delivery Detail actions) goes
  through the same check, so a status can never skip a step regardless of
  which screen triggered the change.
- **Trip fields Phase 1 had no use for yet**
  (`supabase/migrations/20260905070000_trip_cargo_client_audit.sql`) --
  `client_id`, cargo description/quantity/weight, `reference_number`,
  `customer_notes` -- plus the Phase 1 audit trigger attached to `trips`
  for the first time (trips weren't in the original critical-audit list).
- **`trip_stops` gets its own lifecycle**
  (`.../20260905070100_trip_stops_status.sql`) -- a new `trip_stop_status`
  enum (`PLANNED`/`ARRIVED`/`IN_PROGRESS`/`COMPLETED`/`SKIPPED`) so a stop
  can be tracked independently of the parent trip's own status. Simple
  trips carry zero stop rows and stay simple; nothing forces a stop onto a
  direct A-to-B trip.
- **`delivery_status` swapped for the full real-world set**
  (`.../20260905070200_delivery_status_v2.sql`) -- `PENDING`/`IN_TRANSIT`/
  `ARRIVED`/`DELIVERED`/`PARTIALLY_DELIVERED`/`REFUSED`/`DAMAGED`/
  `CANCELLED` replaces Phase 1's placeholder enum (the table had zero rows
  in every environment, so this was a clean swap, the same pattern used for
  `trip_status` in Phase 2). Added `delivery_number`, `expected_quantity`
  and `delivered_quantity` as two separate columns (never collapsed into
  one "delivered: yes/no"), `quantity_unit`, `arrived_at` (distinct from
  `delivered_at` -- arrival and delivery confirmation are different
  events), and `confirmed_by`.
- **Disputes connect to trips/deliveries/vehicles**
  (`.../20260905070300_disputes_trip_delivery_vehicle.sql`) -- three
  nullable FK columns on the existing `disputes` table, not a new
  dispute system. `RaiseDisputeDialog`
  (`src/components/disputes/raise-dispute-dialog.tsx`) is the one place a
  dispute gets created, reused from both Trip Detail and Delivery Detail.
- **GPS stays exactly as GPS-abstracted as before** -- the Trip Detail GPS
  tab (`src/components/trips/detail/gps-section.tsx`) reads the same
  `vehicle_locations`/`gps_events` and the same `computeGpsStatus`/
  `formatGpsFreshness` Phase 1/2 already built. The one addition is
  `detectPossibleArrival()` (`src/lib/gps/arrival-proximity.ts`) -- a
  haversine distance check against a small Ethiopian city-coordinate table
  (`src/lib/geo/ethiopia-cities.ts`) that, when a trip is `DISPATCHED`/
  `IN_TRANSIT` and the vehicle's last fix is within 5 km of the
  destination, surfaces a dismissible "Possible arrival detected" advisory.
  It never writes to the trip -- confirming arrival is always a manual,
  explicit status transition, and a stale or missing GPS fix never changes
  a trip's status either (an `OFFLINE` badge is just a badge).
- **Financial section only shows what's actually attributable**
  (`src/lib/data/trip-finance.ts`) -- revenue is direct (`revenues.trip_id`
  exists); fuel/expenses have no `trip_id` in the schema (they're
  vehicle-scoped only), so they're correlated by time window (occurred
  during the trip's own start/end) and labeled "during this trip", never
  "trip cost", so nothing overclaims a link the data doesn't actually have.
  Every figure is `null` ("No data yet") rather than `0` when nothing
  matches, same rule as the Phase 3 vehicle financial summary.
- **Timeline merges existing audit sources** (`src/lib/data/
  trip-timeline.ts`) -- `audit_logs` for `trips`, `trip_stops`, and
  `deliveries` (all three now carry the Phase 1 audit trigger), the same
  merge-and-sort pattern `getVehicleHistory` established in Phase 3. No new
  event-log table.
- **Delivery evidence reuses Phase 1's `attachments` table and storage
  bucket** (`src/lib/data/attachments.ts`, the upload path in
  `src/app/(app)/deliveries/actions.ts`) -- `entity_type = 'delivery'`
  already existed in the Phase 1 check constraint, so confirming a delivery
  with a photo just uploads to the existing `attachments` storage bucket
  under `<organization_id>/deliveries/<delivery_id>/...` and inserts one row,
  the same architecture every other entity type already uses. No parallel
  file-storage system.
- **Africa/Addis_Ababa timestamps everywhere** (`src/lib/format-time.ts`)
  -- every operational timestamp (trip/delivery detail, timelines, GPS
  events, the Trips/Deliveries tables) now formats with
  `timeZone: "Africa/Addis_Ababa"` explicitly rather than the browser's
  local timezone. This replaced the ad-hoc `toLocaleString(undefined, ...)`
  calls Phases 1-3 had scattered across 8 vehicle-detail/command-center
  components, so business-record times now read the same everywhere,
  consistently, regardless of which browser or device views them.
- **Driver-mobile-app preparation is structural, not built**: every action
  a future driver app would need (start trip, report issue, record fuel,
  confirm arrival, submit delivery evidence) already exists as a
  Server Action or a data-layer mutation a driver-scoped UI could call
  later -- `transitionTripStatus`, `confirmDelivery`, the attachments
  upload path. No driver-facing screen exists yet; see
  [Known limitations](#known-limitations-phase-4).

### Driver Operations (Phase 5)

The Driver module: a full operational record for each driver, built on the
principle that FleetOS records facts and lets an authorized person record a
decision -- it never infers intent, fault, or a "score" from raw events.

- **Every screen is derived, never a duplicate field**
  (`src/lib/domain/driver.ts`) -- a driver's "current vehicle" and "current
  trip" are never stored on the driver row; they're computed each time from
  `vehicle_driver_assignments` (the open row) and `trips` (an active trip
  with this `driver_id`), the same "single source of truth" rule
  `buildFleetBoard` established in Phase 2. `deriveDriverOperationalState()`
  turns the administrative `status` plus that trip (if any) into one of
  `AVAILABLE`/`ON_TRIP`/`LOADING`/`ARRIVED`/`OFF_DUTY`/`ON_LEAVE`/
  `INACTIVE`/`UNKNOWN` -- `OFF_DUTY` is part of the type but never actually
  derived yet, since no shift/clock-in data exists to justify it (never
  fabricate a state the data can't support).
- **`driver_status` normalized and extended**
  (`supabase/migrations/20260905080000_driver_operations.sql`) -- moved to
  the `UPPER_SNAKE_CASE` convention every status enum since Phase 2 already
  uses, and added `ON_LEAVE` (a scheduling fact, distinct from `INACTIVE`/
  `SUSPENDED`, which are administrative decisions). The enum had zero UI
  call sites before this phase, so the swap was clean, not breaking.
  `TERMINATED` (with its existing `termination_date` column) was kept as-is
  -- nothing already there was removed.
  Same migration adds `drivers.employee_id` (+ an org-scoped unique
  constraint alongside a new one on `license_number`), `driver_documents.
  document_number` (mirroring `vehicle_documents` from Phase 3), and
  `disputes.driver_response` (see below). A follow-up migration adds
  `drivers.license_issued_at` (a core Add-Driver field the schema had no
  place for) and a partial unique index guaranteeing at most one *open*
  vehicle assignment per driver, the same guarantee Phase 3 already gave
  per vehicle.
- **Assignment conflicts are shown, never silently resolved**
  (`assignVehicleToDriver` in `src/app/(app)/drivers/[id]/actions.ts`) --
  before closing out an old assignment, it checks whether this driver is
  already on a different open assignment or an active trip, and returns a
  warning a dispatcher has to explicitly confirm (`force=true`) rather than
  applying the change unasked. `EndAssignmentButton` covers the "remove
  driver from vehicle" case the spec calls out separately.
- **Disputes gain a driver side, not a driver-specific system**
  (`disputes.driver_response`, `src/lib/actions/disputes.ts`'s
  `recordDriverResponse`) -- reuses the exact disputes table Phase 4
  connected to trips/deliveries/vehicles; `driver_id` was already a column
  from Phase 1. A driver's response is appended (timestamped), never
  replacing what was there before, and the disputes table now carries the
  Phase 1 audit trigger for the first time, so every version of that field
  is provably in `audit_logs`, not just the current one.
- **Documents reuse the Phase 1 architecture exactly** -- `driver_documents`
  already existed (Phase 1 built it alongside `vehicle_documents`), and
  `computeDocumentStatus()` (Phase 3) needed no changes to work for
  driver licenses/medical cards/training certificates too. The one real
  gap this phase closed: no upload flow existed anywhere in the app before
  now (`vehicle_documents.file_url` has always been `null` in every
  environment). `uploadDriverDocument` uploads to the existing private
  `documents` Storage bucket under `<organization_id>/drivers/<driver_id>/...`
  and `getDriverDocuments` generates a short-lived signed URL per document
  at read time -- the bucket has no public-read policy, so the raw storage
  path is never rendered as a direct link. The same latent gap (a
  `file_url` with no way to view it) still exists for vehicle documents;
  fixing that wasn't this phase's job, since nothing there was ever broken
  by real use (all rows are still `null`).
- **GPS never attaches to a driver directly** -- the Driver Detail page has
  no GPS section of its own; a driver's location is always reached through
  `Driver → vehicle_driver_assignments/trips → Vehicle → vehicle_locations`,
  exactly as the spec requires. If a driver changes vehicles, their GPS
  picture changes with them automatically, because nothing was ever stored
  redundantly in the first place.
- **Operational Performance is plain counts, not a score**
  (`src/lib/data/driver-metrics.ts`) -- completed trips, active trips,
  completed/partial/refused/damaged deliveries, incident count, and total
  distance (`null` when no completed trip has a distance on file) are each
  their own labeled number. There is no combined score, no ranking, and no
  "good driver / bad driver" classification anywhere in the module.
- **Timeline merges existing sources** (`src/lib/data/driver-activity.ts`)
  -- `audit_logs` for the driver's own record, their trips, and their
  deliveries, plus `vehicle_driver_assignments` open/close events. Same
  merge-and-sort pattern as `getVehicleHistory` (Phase 3) and
  `getTripTimeline` (Phase 4); no new event-log table.

## What's deliberately not here

No CRUD for Finance beyond Fuel/Expenses, Compliance, Intelligence, or
Issues beyond a working Incidents-report link-out and the Disputes linkage
(the standalone Disputes list/detail screens themselves are still
placeholders -- disputes can be *raised* and responded to from a trip,
delivery, or driver page, but there's no `/issues/disputes` management UI
yet), plus the quick-action routes still deferred from Phase 2/3
(`/finance/fuel/new`, `/finance/expenses/new`, `/issues/incidents/new`,
`/maintenance/new` render placeholders). No non-mock GPS adapters, no
Amharic/i18n UI (deliberately deferred, but the token layer is ready for it
-- see [Language-neutral by design](#language-neutral-by-design)), no
government/regulatory integrations, no driver-facing mobile app (see
[Known limitations](#known-limitations-phase-5)). The schema, RLS, and
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
`supabase/seed_phase3_ethiopia.sql` then re-anchors that same data on
Ethiopia (renames drivers, restyles vehicles/plates, relocates GPS, adds
`TR-002`-`TR-005` across other Ethiopian corridors, fuel/expense/incident/
document records, and the 4 persistent driver assignments).
`supabase/seed_phase4.sql` adds 3 clients, cargo/client details on
`TR-001`-`TR-005`, a 6th trip (`TR-006`, `ARRIVED`), two multi-stop
examples (`TR-001`: Mojo fuel stop then Hawassa drop-off; `TR-003`: Awash
fuel stop then Dire Dawa drop-off, both fully completed), and 7 deliveries
covering every real-world outcome -- `IN_TRANSIT`, `DELIVERED`,
`DAMAGED` (a second consignment on `TR-002`, demonstrating one trip with
multiple deliveries), `PARTIALLY_DELIVERED`, `REFUSED`, `CANCELLED`, and
`ARRIVED` (awaiting confirmation, for exercising the confirmation dialog).
`supabase/seed_phase5.sql` assigns each of the 5 drivers an `employee_id`
and a `license_issued_at`, moves one driver (Henok Girma) to `ON_LEAVE`,
adds 8 driver documents spanning `VALID`/`EXPIRING_SOON`/`EXPIRED` license
statuses plus a medical card and a training certificate, and adds one
dispute connecting the refused `TR-004`/`DL-004` delivery to the driver who
ran it, with a driver response preserved alongside the client's side.
All five were applied directly against the Supabase project for this
environment; on a fresh project, run the migrations in
`supabase/migrations/` in order, then all five seed files in order
(`seed.sql`, `seed_phase2.sql`, `seed_phase3_ethiopia.sql`,
`seed_phase4.sql`, `seed_phase5.sql`).

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
- **Fuel/expense/incident "quick actions" are still placeholders.** Only
  Add/Edit Vehicle and Assign Driver got real forms in Phase 3; Record
  Fuel, Report Issue, and Schedule Maintenance still link to placeholder
  routes with an unconsumed `?vehicleId=` param. (Start Trip, the fourth
  quick action listed here originally, now works -- see Phase 4 below.)
- **Vehicles list filters are client-side, not URL-persisted** -- they
  reset on refresh; not shareable/bookmarkable yet.
- **GPS still goes stale without a sync** -- same as Phase 2's limitation,
  unchanged by this phase.

## Known limitations (Phase 4)

- **Role restrictions are still app-layer only, not yet RLS** -- same
  constraint as Phase 3, now also covering `trips`/`trip_stops`/
  `deliveries`/`disputes`: `canManageFleet` gates every UI control and
  Server Action, but the underlying RLS policies still let any org member
  write. Unchanged from Phase 3's note -- a deliberate, not accidental,
  scope decision each phase so far.
- **Trip/Delivery status changes are app-layer validated, not
  database-enforced.** `canTransition`/`canTransitionDelivery` is the one
  gate every Server Action goes through, but nothing stops a direct SQL
  `UPDATE` (or a future second app) from writing an illegal status
  transition straight into the `trips`/`deliveries` tables. A database
  constraint or trigger enforcing the same state machine is a natural
  next step, not a redesign.
- **No date-range or client filter on the Trips page yet.** Status,
  vehicle, driver, and free-text search all work and compose together;
  a scheduled-date range and a client filter (both mentioned as
  "nice to have" alongside the others) weren't added this phase.
- **Delivery confirmation evidence is a single file per submission**, not
  multiple files, a delivery-document type/description field per
  attachment, or a signature capture -- the `attachments` table already
  supports a `description`/type-like classification (via `entity_type`
  alone) and multiple rows per entity, so multi-file upload is additive
  when needed, not a redesign.
- **Trip Stops has no add/edit UI.** `trip_stops` is fully modeled and
  displayed (status, sequence, arrival/departure, notes) and the seed data
  demonstrates a real multi-stop trip, but stops are currently only
  created via direct SQL/seed data -- there's no form on Trip Detail to
  add, reorder, or update a stop's status yet.
- **No driver-facing screens** -- Part 13 of the spec explicitly asked for
  architecture preparation, not a driver app, so none was built. Every
  action a driver would need is already a callable Server Action.
- **GPS still goes stale without a sync** -- unchanged since Phase 2;
  worth noting again because several Phase 4 demo trips (`TR-001`,
  `TR-006`) are `IN_TRANSIT`/`ARRIVED` and their GPS freshness will
  correctly decay to `DELAYED`/`OFFLINE` as real time passes after seeding,
  same honest behavior as every other phase.

## Known limitations (Phase 5)

- **Role restrictions are still app-layer only, not yet RLS** -- same
  constraint as every prior phase, now also covering `drivers`/
  `driver_documents`. `canManageFleet` gates every UI control and Server
  Action; the underlying RLS policies still let any org member write.
- **The Driver → Vehicle assignment invariant is now DB-enforced
  (one open assignment per driver, mirroring the existing per-vehicle
  guarantee), but the driver ↔ active-trip conflict is app-layer only** --
  `assignVehicleToDriver` checks for it and shows a warning, but nothing in
  the schema stops a direct write from putting a driver on two active
  trips at once. A trigger enforcing that is a natural next step.
- **`OFF_DUTY` is a defined operational state that's never actually
  derived** -- there's no shift/clock-in data anywhere in the schema to
  justify showing it, so `deriveDriverOperationalState` never returns it
  yet. Included in the type for when that data exists, not faked now.
- **The same `file_url`-as-private-path gap in `vehicle_documents` (Phase
  1/3) is now fixed for `driver_documents` but not retroactively for
  vehicles** -- every `vehicle_documents.file_url` in every environment
  has always been `null` (no upload flow ever existed for it before this
  phase either), so nothing that worked before is broken; fixing the
  vehicle side is additive cleanup, not something this phase's scope
  required.
- **Driver document upload is a single file per document row**, matching
  the same one-file-per-submission scope note as Phase 4's delivery
  evidence -- multiple files per document type is additive when needed.
- **The Disputes list/detail management screens (`/issues/disputes`)
  still don't exist** -- disputes can be raised and responded to from a
  trip, delivery, or driver page (three phases of linkage now: Phase 1's
  base table, Phase 4's trip/delivery/vehicle columns, this phase's
  `driver_response`), but there is still no standalone place to browse or
  triage all disputes across the organization.
- **GPS still goes stale without a sync** -- unchanged since Phase 2.

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

**Phase 4 (additional):**
- `npm run build`, `npx tsc --noEmit`, `npx eslint .` -- all clean, run
  fresh after every file change through this phase, not just once at the
  end. 41 routes now, including `/trips/[id]` and `/deliveries/[id]`.
- All 4 Phase 4 migrations (trip cargo/client fields + audit trigger,
  `trip_stop_status`, `delivery_status` v2 + quantity/confirmation fields,
  disputes trip/delivery/vehicle links) applied to and verified against
  the live database, not just locally -- confirmed via
  `information_schema`/`pg_constraint` queries that every foreign key the
  data layer's `select` embeds rely on actually exists (`trips.client_id`
  → `clients`, `deliveries.trip_id`/`client_id`/`trip_stop_id`,
  `disputes.trip_id`/`delivery_id`/`vehicle_id`) before writing a single
  query against them.
- Re-ran the security advisor after all 4 migrations: no new findings
  beyond the same pre-existing intentional ones from every prior phase
  (no new RLS gaps on `trips`/`trip_stops`/`deliveries`/`disputes`).
- Seed data (`seed_phase4.sql`: 3 clients, cargo/client details on
  `TR-001`-`TR-005`, a 6th trip `TR-006`, 2 multi-stop trips, 7
  deliveries) was applied directly to the live database and then verified
  with a join query mirroring the app's own `deliveries` query shape
  (delivery → trip → client → trip_stop) -- confirmed all 7 deliveries
  resolve with the correct trip/client/stop and the correct
  expected-vs-delivered quantity split (e.g. `DL-003`:
  expected 300, delivered 280; `DL-006`: expected 100, delivered 0,
  `DAMAGED`), rather than trusting the insert succeeded without checking
  what it actually produced.
- `recent_activity_feed` re-checked after the new trips existed --
  confirmed it still returns `TRIP_STATUS_CHANGED` rows for all of
  them (including the new `TR-006`), verifying the Phase 2 view and the
  Command Center's activity feed have no regression from the new trips
  table shape (added columns, new audit trigger).
- The state machine itself (`canTransition`/`canTransitionDelivery`) was
  run directly (via `tsx`, against the real seeded data's statuses, not
  just read) -- confirmed trip `TR-001` (`IN_TRANSIT`) allows only
  `ARRIVED`/`CANCELLED` next (and `canTransition("IN_TRANSIT",
  "DELIVERED")` is correctly `false` -- a trip can't skip straight to
  delivered), trip `TR-006` (`ARRIVED`) allows only `DELIVERED`/
  `CANCELLED` (a trip's own lifecycle has no partial/refused/damaged
  branch -- that nuance lives one level down, on the delivery), a
  *delivery* at `ARRIVED` (like `DL-007`) allows all five of
  `DELIVERED`/`PARTIALLY_DELIVERED`/`REFUSED`/`DAMAGED`/`CANCELLED`, and
  every terminal status (`COMPLETED`, `DAMAGED`, `CANCELLED`) allows
  nothing further.
- The arrival-proximity advisory (`detectPossibleArrival`) was checked
  against `TR-006`'s actual coordinates: its destination (`Mojo`) resolves
  to a known city in `ethiopia-cities.ts`, confirming the lookup path
  works for real seeded data, not just synthetic test coordinates.
- **Not verified** (same constraint as every prior phase): an authenticated
  browser session clicking through the New Trip form, the Dispatch board's
  status-transition buttons, or the Delivery Confirmation dialog's file
  upload end-to-end. All of it was instead verified at the data/query
  layer as shown above, plus a full production build succeeding with every
  new route present. A real click-through pass (including confirming a
  file actually lands in the `attachments` Storage bucket via a live
  browser upload) is the one remaining check for this phase, same
  limitation every phase before it has carried.

**Phase 5 (additional):**
- `npm run build`, `npx tsc --noEmit`, `npx eslint .` -- all clean, run
  after every file change through this phase. 40 routes now, including
  `/drivers`, `/drivers/new`, `/drivers/[id]`, and `/drivers/[id]/edit`.
- All 3 Phase 5 migrations (driver `employee_id`/license uniqueness/
  `driver_status` uppercase+`ON_LEAVE`/`driver_documents.document_number`/
  `disputes.driver_response`; `drivers.license_issued_at`; the one-open-
  assignment-per-driver partial unique index) applied to and verified
  against the live database -- confirmed via `pg_enum` that the swapped
  `driver_status` enum has exactly the 5 intended values, via
  `pg_indexes` that the new partial unique index exists alongside the
  pre-existing per-vehicle one, and via `pg_trigger` that `disputes`
  already carried the Phase 1 audit trigger (so no redundant trigger was
  added, avoiding the exact `already exists` migration error this surfaced
  and was fixed on the first apply attempt).
- Re-ran the security advisor after all 3 migrations: no new findings
  beyond the same pre-existing intentional ones from every prior phase --
  no new RLS gaps on `drivers`/`driver_documents`/`disputes`, and the
  `documents` Storage bucket's existing org-prefixed policies (unchanged)
  correctly scope the new driver-document upload path.
- Seed data (`seed_phase5.sql`) was applied directly and then verified
  with join queries mirroring the app's own query shapes: the driver
  board's derivation query (driver → open assignment → active trip)
  returns the expected operational picture for all 5 drivers (e.g. Henok
  Girma correctly shows `ON_LEAVE` with no active trip; Samuel Bekele
  shows no vehicle and no trip); the dispute join (dispute → driver →
  trip → delivery → vehicle → client) resolves every relation for the
  seeded `TR-004`/`DL-004` dispute exactly as `getDriverDisputes` selects
  it.
- The `dispute_status` enum was checked directly against `pg_enum` after
  an insert attempt failed on a guessed value (`'investigating'`) --
  caught the mismatch, fixed both the seed data and the
  `DriverDisputesTab` component's status-label/badge maps (which had the
  same wrong guessed values), and re-verified the corrected insert
  succeeded. A real example of verifying against the schema instead of
  assuming an enum's shape.
- Noticed, incidentally, that trip `TR-001` had genuinely transitioned
  from `IN_TRANSIT` to `ARRIVED` in `audit_logs` with a timestamp inside
  this working session -- i.e. real usage of the Phase 4 UI (New Trip /
  Dispatch / Trip Detail's status-transition buttons) happened live in a
  browser during this session, independent of anything this phase did.
  Not something this phase verified itself, but evidence the Phase 4
  workflow functions in a real browser, not just against direct SQL.
- **Not verified** (same constraint as every prior phase): an authenticated
  browser session clicking through Add/Edit Driver, the Assign Vehicle
  conflict-warning flow, or the Upload Document dialog's file upload and
  signed-URL "View" link end-to-end. All of it was instead verified at the
  data/query layer as shown above, plus a full production build succeeding
  with every new route present.
