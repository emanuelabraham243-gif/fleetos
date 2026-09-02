-- ============================================================================
-- vendors
-- ============================================================================
create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  category public.vendor_category not null default 'other',
  contact_name text,
  phone text,
  email text,
  address text,
  notes text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index vendors_organization_id_idx on public.vendors (organization_id) where archived_at is null;

create trigger set_updated_at
  before update on public.vendors
  for each row execute function public.set_updated_at();

-- ============================================================================
-- maintenance_schedules: preventive-maintenance intervals per vehicle.
-- ============================================================================
create table public.maintenance_schedules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  title text not null,
  interval_km numeric(10, 1) check (interval_km is null or interval_km > 0),
  interval_days integer check (interval_days is null or interval_days > 0),
  last_done_at date,
  last_done_odometer_km numeric(10, 1),
  next_due_at date,
  next_due_odometer_km numeric(10, 1),
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (interval_km is not null or interval_days is not null)
);

create index maintenance_schedules_vehicle_id_idx on public.maintenance_schedules (vehicle_id);

create trigger set_updated_at
  before update on public.maintenance_schedules
  for each row execute function public.set_updated_at();

-- ============================================================================
-- maintenance_issues: a reported problem. `source` records where the claim
-- came from (driver report vs. inspection vs. a GPS-derived anomaly) so the
-- UI can present it as what it is, not as an established fact.
-- ============================================================================
create table public.maintenance_issues (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  reported_by uuid references public.profiles (id) on delete set null,
  source public.maintenance_issue_source not null default 'driver_report',
  severity public.maintenance_issue_severity not null default 'medium',
  status public.maintenance_issue_status not null default 'open',
  title text not null,
  description text,
  reported_at timestamptz not null default now(),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index maintenance_issues_organization_id_idx on public.maintenance_issues (organization_id);
create index maintenance_issues_vehicle_id_idx on public.maintenance_issues (vehicle_id);
create index maintenance_issues_status_idx on public.maintenance_issues (organization_id, status);

create trigger set_updated_at
  before update on public.maintenance_issues
  for each row execute function public.set_updated_at();

-- ============================================================================
-- work_orders
-- ============================================================================
create table public.work_orders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  maintenance_issue_id uuid references public.maintenance_issues (id) on delete set null,
  vendor_id uuid references public.vendors (id) on delete set null,
  title text not null,
  description text,
  status public.work_order_status not null default 'open',
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  total_cost numeric(12, 2) check (total_cost is null or total_cost >= 0),
  currency text not null default 'USD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index work_orders_organization_id_idx on public.work_orders (organization_id);
create index work_orders_vehicle_id_idx on public.work_orders (vehicle_id);
create index work_orders_status_idx on public.work_orders (organization_id, status);

create trigger set_updated_at
  before update on public.work_orders
  for each row execute function public.set_updated_at();

-- ============================================================================
-- maintenance_parts: line items on a work order.
-- ============================================================================
create table public.maintenance_parts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  work_order_id uuid not null references public.work_orders (id) on delete cascade,
  part_name text not null,
  part_number text,
  quantity numeric(8, 2) not null default 1 check (quantity > 0),
  unit_cost numeric(12, 2) not null default 0 check (unit_cost >= 0),
  total_cost numeric(12, 2) generated always as (quantity * unit_cost) stored,
  created_at timestamptz not null default now()
);

create index maintenance_parts_work_order_id_idx on public.maintenance_parts (work_order_id);

-- ============================================================================
-- inspections
-- ============================================================================
create table public.inspections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  driver_id uuid references public.drivers (id) on delete set null,
  inspection_type public.inspection_type not null default 'pre_trip',
  performed_at timestamptz not null default now(),
  odometer_km numeric(10, 1),
  passed boolean not null default true,
  findings text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index inspections_organization_id_idx on public.inspections (organization_id);
create index inspections_vehicle_id_idx on public.inspections (vehicle_id, performed_at desc);

create trigger set_updated_at
  before update on public.inspections
  for each row execute function public.set_updated_at();

-- ============================================================================
-- RLS
-- ============================================================================
alter table public.vendors enable row level security;
alter table public.maintenance_schedules enable row level security;
alter table public.maintenance_issues enable row level security;
alter table public.work_orders enable row level security;
alter table public.maintenance_parts enable row level security;
alter table public.inspections enable row level security;

create policy "org members can read vendors" on public.vendors for select
  to authenticated using (organization_id = public.current_org_id());
create policy "org members can write vendors" on public.vendors for insert
  to authenticated with check (organization_id = public.current_org_id());
create policy "org members can update vendors" on public.vendors for update
  to authenticated using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

create policy "org members can read maintenance schedules" on public.maintenance_schedules for select
  to authenticated using (organization_id = public.current_org_id());
create policy "org members can write maintenance schedules" on public.maintenance_schedules for insert
  to authenticated with check (organization_id = public.current_org_id());
create policy "org members can update maintenance schedules" on public.maintenance_schedules for update
  to authenticated using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

create policy "org members can read maintenance issues" on public.maintenance_issues for select
  to authenticated using (organization_id = public.current_org_id());
create policy "org members can write maintenance issues" on public.maintenance_issues for insert
  to authenticated with check (organization_id = public.current_org_id());
create policy "org members can update maintenance issues" on public.maintenance_issues for update
  to authenticated using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

create policy "org members can read work orders" on public.work_orders for select
  to authenticated using (organization_id = public.current_org_id());
create policy "org members can write work orders" on public.work_orders for insert
  to authenticated with check (organization_id = public.current_org_id());
create policy "org members can update work orders" on public.work_orders for update
  to authenticated using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

create policy "org members can read maintenance parts" on public.maintenance_parts for select
  to authenticated using (organization_id = public.current_org_id());
create policy "org members can write maintenance parts" on public.maintenance_parts for insert
  to authenticated with check (organization_id = public.current_org_id());

create policy "org members can read inspections" on public.inspections for select
  to authenticated using (organization_id = public.current_org_id());
create policy "org members can write inspections" on public.inspections for insert
  to authenticated with check (organization_id = public.current_org_id());
create policy "org members can update inspections" on public.inspections for update
  to authenticated using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());
