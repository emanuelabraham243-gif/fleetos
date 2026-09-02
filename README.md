# FleetOS

Fleet management and transport operations platform, built for a small
trucking business running 4 vehicles. This is the **Phase 1 technical
foundation**: database schema, multi-tenancy, RLS, auth, the GPS provider
abstraction, and the application shell. No module's UI is fully built out
yet -- see [What's deliberately not here](#whats-deliberately-not-here).

## Stack

- Next.js 16 (App Router, Turbopack) + React 19 + TypeScript (strict)
- Tailwind CSS v4 + hand-scaffolded shadcn/ui primitives (`src/components/ui`)
- Supabase: Postgres, Auth, Storage, Row Level Security

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in your Supabase project URL + anon key
npm run dev
```

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
renders `AppShell` (`src/components/app-shell.tsx`): a sidebar on desktop,
a `Sheet`-based drawer on mobile, and the full navigation tree from
`src/lib/nav.ts` (Command Center, Operations, Fleet, Finance, Compliance,
Intelligence, Issues, System). Every route in that tree exists and
resolves; most render `PagePlaceholder` (`src/components/page-placeholder.tsx`)
-- an honest "not built yet" state rather than fabricated rows. Vehicles
and Drivers are real, data-backed list pages (including the GPS status
badge) since the schema, seed data, and GPS status calculation all exist
to back them.

## What's deliberately not here

Per the Phase 1 brief: no full Command Center (map, dispatch board), no
CRUD for Trips/Finance/Maintenance/Compliance/Intelligence/Issues/System
modules, no non-mock GPS adapters, no government/regulatory integrations.
The schema, RLS, and navigation route for every one of those already
exist -- only the working screen is deferred.

## Seeding

Demo data (one organization, 2 users, 4 vehicles, 4 drivers, 1 mock GPS
connection, 3 GPS devices/events covering live/delayed/offline, and the
4th vehicle intentionally left without a device to demonstrate "unknown")
lives in `supabase/seed.sql`. It was applied directly against the Supabase
project for this environment; if you're setting up a fresh project, run
the migrations in `supabase/migrations/` in order, then run
`supabase/seed.sql` against that project (e.g. via the Supabase SQL editor,
or `psql` against the project's connection string).

## Verification performed

- `npm run build` -- clean production build, all 27 routes compile.
- `npx tsc --noEmit` (via the build's typecheck step) -- no errors.
- `npx eslint .` -- no errors or warnings.
- All 14 migrations applied to the live Supabase project; `list_tables`
  confirms all 34 tables with RLS enabled; the security/performance
  advisors were run and every actionable finding (unindexed foreign keys,
  RLS policies re-evaluating `auth.uid()` per row, overly-public
  `security definer` functions) was fixed.
- Seed data counts confirmed directly against the database (1 org, 2 auth
  users, 2 profiles created via the `handle_new_user` trigger, 4 vehicles,
  4 drivers, 3 GPS devices/events, 3 cached locations).
- The GPS mock provider and `computeGpsStatus` were exercised directly
  (pure functions, no I/O) against the spec's own examples (2 min -> live,
  15 min -> delayed, 60 min -> offline, no data -> unknown) -- all pass.
- The app was started (`next start`) and hit directly over HTTP: `/login`
  renders (200, real shadcn-styled markup, compiled Tailwind design
  tokens present in the CSS), every protected route correctly 307-redirects
  to `/login?next=<path>` when unauthenticated.
- **Not verified**: an actual browser sign-in against the live Supabase
  Auth API from inside this environment -- this sandbox's egress policy
  blocks outbound HTTPS to `supabase.co` (confirmed via the proxy status
  endpoint, same restriction that blocked the shadcn CLI). The database
  side of auth (the `auth.users` rows, the `handle_new_user` trigger
  firing and creating matching `profiles` rows) was verified directly
  against the database instead. Sign in with the demo credentials above
  from a normal network to confirm the client-side flow.
