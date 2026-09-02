-- ============================================================================
-- vehicle_driver_assignments: who is responsible for a vehicle long-term,
-- as distinct from who happens to be driving it on the current trip.
-- Append-only history -- a driver change never destroys the old row, it
-- closes it out (unassigned_at) and inserts a new one. The partial unique
-- index is what guarantees at most one *open* assignment per vehicle at a
-- time without needing a separate "is_current" flag to keep in sync.
-- ============================================================================
create table public.vehicle_driver_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  driver_id uuid not null references public.drivers (id) on delete restrict,
  assigned_by uuid references public.profiles (id) on delete set null,
  assigned_at timestamptz not null default now(),
  unassigned_at timestamptz,
  created_at timestamptz not null default now(),
  check (unassigned_at is null or unassigned_at >= assigned_at)
);

create unique index vehicle_driver_assignments_active_idx
  on public.vehicle_driver_assignments (vehicle_id)
  where unassigned_at is null;

create index vehicle_driver_assignments_vehicle_id_idx
  on public.vehicle_driver_assignments (vehicle_id, assigned_at desc);
create index vehicle_driver_assignments_driver_id_idx
  on public.vehicle_driver_assignments (driver_id);
create index vehicle_driver_assignments_organization_id_idx
  on public.vehicle_driver_assignments (organization_id);

alter table public.vehicle_driver_assignments enable row level security;

create policy "org members can read driver assignments"
  on public.vehicle_driver_assignments for select
  to authenticated using (organization_id = public.current_org_id());
create policy "org members can create driver assignments"
  on public.vehicle_driver_assignments for insert
  to authenticated with check (organization_id = public.current_org_id());
create policy "org members can close driver assignments"
  on public.vehicle_driver_assignments for update
  to authenticated using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

-- Every open/close is captured the same way vehicle edits already are.
create trigger audit_changes
  after update or delete on public.vehicle_driver_assignments
  for each row execute function public.record_audit_event();

-- ============================================================================
-- Vehicle fields the Add/Edit Vehicle form needs that Phase 1 didn't have
-- a use for yet. Nullable, so nothing existing is affected.
-- ============================================================================
alter table public.vehicles add column capacity_kg numeric(10, 1) check (capacity_kg is null or capacity_kg >= 0);
alter table public.vehicles add column engine_number text;

-- "Do not allow duplicate plate numbers within the same organization."
-- Multiple NULLs are still allowed (a vehicle without a plate on file yet).
alter table public.vehicles
  add constraint vehicles_organization_id_license_plate_key unique (organization_id, license_plate);

-- ============================================================================
-- The Expenses tab's spec'd categories (Parts, Tires, Driver-related)
-- aren't in the Phase 1 enum -- Fuel already has its own dedicated table
-- (fuel_transactions), so it's deliberately not added here.
-- ============================================================================
alter type public.expense_category add value if not exists 'parts';
alter type public.expense_category add value if not exists 'tires';
alter type public.expense_category add value if not exists 'driver_related';
