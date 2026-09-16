-- ============================================================================
-- Real paper-log service categories (Engine Oil Service, Differential/Gearbox
-- Service, Garage/Tire-Axle Service, Tire Purchase & Installation) answer a
-- third question orthogonal to both existing work_orders taxonomies:
-- maintenance_issues.issue_type is the reported problem area, maintenance_type
-- is why the work is happening (PREVENTIVE/CORRECTIVE/etc), and
-- service_category is what kind of service was actually performed/paid for.
-- Nullable and additive -- existing work orders are never backfilled/guessed.
-- Category-specific fields live in a 1:1 child table (mirroring the existing
-- maintenance_labor/maintenance_parts pattern) rather than as ~15 sparse
-- columns on work_orders itself, which stays on the hot list-select path.
-- Cost and kilometer fields from the paper logs are NOT duplicated here --
-- work_orders.odometer_km/completion_odometer_km already capture "kilometer
-- at service", and cost already has one source of truth in
-- maintenance_parts/maintenance_labor/linked expenses (computeWorkOrderCostBreakdown).
-- ============================================================================

create type public.work_order_service_category as enum (
  'ENGINE_OIL_SERVICE',
  'DIFFERENTIAL_GEARBOX_SERVICE',
  'GARAGE_TIRE_AXLE_SERVICE',
  'TIRE_PURCHASE_INSTALLATION'
);

alter table public.work_orders
  add column service_category public.work_order_service_category;

create table public.work_order_service_details (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  work_order_id uuid not null unique references public.work_orders (id) on delete cascade,

  -- Engine Oil Service
  filter_type text check (filter_type is null or filter_type in ('full', 'half')),

  -- Differential/Gearbox Service
  place_serviced text,
  differential_side text check (differential_side is null or differential_side in ('front', 'rear', 'both')),
  differential_oil_notes text,
  gearbox_cab_oil_notes text,

  -- Garage/Tire-Axle Service
  trailer_tire boolean,

  -- Tire Purchase & Installation
  tire_type text,
  tire_serial_number text,
  front_tire_count integer check (front_tire_count is null or front_tire_count >= 0),
  rear_tire_count integer check (rear_tire_count is null or rear_tire_count >= 0),

  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index work_order_service_details_organization_id_idx on public.work_order_service_details (organization_id);

create trigger set_updated_at
  before update on public.work_order_service_details
  for each row execute function set_updated_at();

alter table public.work_order_service_details enable row level security;

create policy "org members can read work order service details"
  on public.work_order_service_details for select
  using (organization_id = current_org_id());

create policy "org members can write work order service details"
  on public.work_order_service_details for all
  with check (organization_id = current_org_id());

create trigger audit_changes
  after insert or update or delete on public.work_order_service_details
  for each row execute function record_audit_event();
