-- ============================================================================
-- vehicles
-- ============================================================================
create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  unit_number text not null,
  vin text,
  make text,
  model text,
  year smallint check (year is null or (year between 1980 and 2100)),
  license_plate text,
  vehicle_type public.vehicle_type not null default 'truck',
  status public.vehicle_status not null default 'active',
  fuel_type public.fuel_type not null default 'diesel',
  color text,
  odometer_km numeric(10, 1) not null default 0 check (odometer_km >= 0),
  purchased_at date,
  notes text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, unit_number)
);

create index vehicles_organization_id_idx on public.vehicles (organization_id) where archived_at is null;
create index vehicles_status_idx on public.vehicles (organization_id, status);

create trigger set_updated_at
  before update on public.vehicles
  for each row execute function public.set_updated_at();

-- ============================================================================
-- drivers
-- ============================================================================
create table public.drivers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  profile_id uuid references public.profiles (id) on delete set null,
  full_name text not null check (char_length(trim(full_name)) > 0),
  email text,
  phone text,
  license_number text,
  license_class text,
  license_expiry date,
  status public.driver_status not null default 'active',
  hire_date date,
  termination_date date,
  notes text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index drivers_organization_id_idx on public.drivers (organization_id) where archived_at is null;
create index drivers_profile_id_idx on public.drivers (profile_id);
create index drivers_status_idx on public.drivers (organization_id, status);

create trigger set_updated_at
  before update on public.drivers
  for each row execute function public.set_updated_at();

-- ============================================================================
-- RLS: standard per-organization isolation, applied identically across every
-- operational table below. Members can read/write within their own org;
-- there is no cross-org access path.
-- ============================================================================
alter table public.vehicles enable row level security;
alter table public.drivers enable row level security;

create policy "org members can read vehicles" on public.vehicles for select
  to authenticated using (organization_id = public.current_org_id());
create policy "org members can write vehicles" on public.vehicles for insert
  to authenticated with check (organization_id = public.current_org_id());
create policy "org members can update vehicles" on public.vehicles for update
  to authenticated using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

create policy "org members can read drivers" on public.drivers for select
  to authenticated using (organization_id = public.current_org_id());
create policy "org members can write drivers" on public.drivers for insert
  to authenticated with check (organization_id = public.current_org_id());
create policy "org members can update drivers" on public.drivers for update
  to authenticated using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());
