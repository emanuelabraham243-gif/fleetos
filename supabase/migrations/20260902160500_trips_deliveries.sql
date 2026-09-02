-- ============================================================================
-- trips
-- ============================================================================
create table public.trips (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  vehicle_id uuid not null references public.vehicles (id) on delete restrict,
  driver_id uuid references public.drivers (id) on delete set null,
  contract_id uuid references public.contracts (id) on delete set null,
  trip_number text not null,
  status public.trip_status not null default 'planned',
  origin text,
  destination text,
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  actual_start timestamptz,
  actual_end timestamptz,
  distance_km numeric(8, 1) check (distance_km is null or distance_km >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, trip_number)
);

create index trips_organization_id_idx on public.trips (organization_id);
create index trips_vehicle_id_idx on public.trips (vehicle_id);
create index trips_driver_id_idx on public.trips (driver_id);
create index trips_status_idx on public.trips (organization_id, status);

create trigger set_updated_at
  before update on public.trips
  for each row execute function public.set_updated_at();

-- ============================================================================
-- trip_stops
-- ============================================================================
create table public.trip_stops (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  trip_id uuid not null references public.trips (id) on delete cascade,
  sequence smallint not null check (sequence > 0),
  stop_type public.trip_stop_type not null default 'dropoff',
  location text not null,
  scheduled_at timestamptz,
  arrived_at timestamptz,
  departed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (trip_id, sequence)
);

create index trip_stops_trip_id_idx on public.trip_stops (trip_id);

create trigger set_updated_at
  before update on public.trip_stops
  for each row execute function public.set_updated_at();

-- ============================================================================
-- deliveries
-- ============================================================================
create table public.deliveries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  trip_id uuid references public.trips (id) on delete set null,
  trip_stop_id uuid references public.trip_stops (id) on delete set null,
  client_id uuid references public.clients (id) on delete set null,
  reference_number text,
  description text,
  status public.delivery_status not null default 'pending',
  scheduled_at timestamptz,
  delivered_at timestamptz,
  recipient_name text,
  proof_of_delivery_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index deliveries_organization_id_idx on public.deliveries (organization_id);
create index deliveries_trip_id_idx on public.deliveries (trip_id);
create index deliveries_status_idx on public.deliveries (organization_id, status);

create trigger set_updated_at
  before update on public.deliveries
  for each row execute function public.set_updated_at();

alter table public.trips enable row level security;
alter table public.trip_stops enable row level security;
alter table public.deliveries enable row level security;

create policy "org members can read trips" on public.trips for select
  to authenticated using (organization_id = public.current_org_id());
create policy "org members can write trips" on public.trips for insert
  to authenticated with check (organization_id = public.current_org_id());
create policy "org members can update trips" on public.trips for update
  to authenticated using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

create policy "org members can read trip stops" on public.trip_stops for select
  to authenticated using (organization_id = public.current_org_id());
create policy "org members can write trip stops" on public.trip_stops for insert
  to authenticated with check (organization_id = public.current_org_id());
create policy "org members can update trip stops" on public.trip_stops for update
  to authenticated using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

create policy "org members can read deliveries" on public.deliveries for select
  to authenticated using (organization_id = public.current_org_id());
create policy "org members can write deliveries" on public.deliveries for insert
  to authenticated with check (organization_id = public.current_org_id());
create policy "org members can update deliveries" on public.deliveries for update
  to authenticated using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());
