-- ============================================================================
-- gps_providers: catalog of provider ADAPTERS FleetOS knows how to speak to.
-- Not organization-scoped -- this is the shared registry of integration
-- types (REST, webhook, MQTT, TCP, SDK, CSV, DB, manual). An org connects to
-- one of these via gps_connections. This is what keeps FleetOS decoupled
-- from any single GPS vendor.
-- ============================================================================
create table public.gps_providers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  integration_type public.gps_integration_type not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at
  before update on public.gps_providers
  for each row execute function public.set_updated_at();

-- Everyone authenticated can see which provider adapters exist (it's just a
-- capability catalog, not tenant data).
alter table public.gps_providers enable row level security;
create policy "authenticated users can read the gps provider catalog"
  on public.gps_providers for select to authenticated using (true);

-- ============================================================================
-- gps_connections: an organization's configured instance of a provider.
-- `config` holds adapter-specific settings (API base URL, webhook secret,
-- MQTT topic, poll interval, etc.) -- never raw credentials in plaintext;
-- secrets belong in Supabase Vault and are referenced here by name.
-- ============================================================================
create table public.gps_connections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  gps_provider_id uuid not null references public.gps_providers (id) on delete restrict,
  name text not null,
  status public.gps_connection_status not null default 'active',
  config jsonb not null default '{}'::jsonb,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index gps_connections_organization_id_idx on public.gps_connections (organization_id);

create trigger set_updated_at
  before update on public.gps_connections
  for each row execute function public.set_updated_at();

-- ============================================================================
-- vehicle_devices: a physical/virtual tracking device installed on a vehicle,
-- reporting through a specific gps_connection.
-- ============================================================================
create table public.vehicle_devices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  gps_connection_id uuid not null references public.gps_connections (id) on delete restrict,
  external_device_id text not null,
  serial_number text,
  installed_at timestamptz not null default now(),
  removed_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (gps_connection_id, external_device_id)
);

create index vehicle_devices_organization_id_idx on public.vehicle_devices (organization_id);
create index vehicle_devices_vehicle_id_idx on public.vehicle_devices (vehicle_id);

create trigger set_updated_at
  before update on public.vehicle_devices
  for each row execute function public.set_updated_at();

-- ============================================================================
-- gps_events: the append-only, normalized event stream. Every adapter --
-- REST poll, webhook delivery, MQTT message, TCP frame, CSV import row --
-- is translated into this one shape before it ever reaches the rest of
-- FleetOS. `raw_payload` retains the original payload as evidence.
-- ============================================================================
create table public.gps_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  vehicle_device_id uuid not null references public.vehicle_devices (id) on delete cascade,
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  recorded_at timestamptz not null,
  received_at timestamptz not null default now(),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  speed_kph numeric(6, 2) check (speed_kph is null or speed_kph >= 0),
  heading_degrees numeric(5, 1) check (heading_degrees is null or heading_degrees between 0 and 360),
  ignition_on boolean,
  odometer_km numeric(10, 1) check (odometer_km is null or odometer_km >= 0),
  movement_state public.movement_state not null default 'unknown',
  raw_payload jsonb,
  created_at timestamptz not null default now()
);

create index gps_events_vehicle_id_recorded_at_idx on public.gps_events (vehicle_id, recorded_at desc);
create index gps_events_organization_id_idx on public.gps_events (organization_id);

-- ============================================================================
-- vehicle_locations: one row per vehicle holding its latest known position.
-- Kept in sync from gps_events by trigger so "where is this truck right now"
-- is an O(1) lookup instead of a scan over the event stream.
-- ============================================================================
create table public.vehicle_locations (
  vehicle_id uuid primary key references public.vehicles (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  gps_event_id uuid not null references public.gps_events (id) on delete cascade,
  latitude double precision not null,
  longitude double precision not null,
  speed_kph numeric(6, 2),
  heading_degrees numeric(5, 1),
  ignition_on boolean,
  odometer_km numeric(10, 1),
  movement_state public.movement_state not null default 'unknown',
  recorded_at timestamptz not null,
  updated_at timestamptz not null default now()
);

create or replace function public.upsert_vehicle_location()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.vehicle_locations (
    vehicle_id, organization_id, gps_event_id, latitude, longitude,
    speed_kph, heading_degrees, ignition_on, odometer_km, movement_state, recorded_at, updated_at
  )
  values (
    new.vehicle_id, new.organization_id, new.id, new.latitude, new.longitude,
    new.speed_kph, new.heading_degrees, new.ignition_on, new.odometer_km, new.movement_state, new.recorded_at, now()
  )
  on conflict (vehicle_id) do update set
    gps_event_id = excluded.gps_event_id,
    latitude = excluded.latitude,
    longitude = excluded.longitude,
    speed_kph = excluded.speed_kph,
    heading_degrees = excluded.heading_degrees,
    ignition_on = excluded.ignition_on,
    odometer_km = excluded.odometer_km,
    movement_state = excluded.movement_state,
    recorded_at = excluded.recorded_at,
    updated_at = now()
  where excluded.recorded_at >= public.vehicle_locations.recorded_at;
  return new;
end;
$$;

create trigger gps_events_upsert_vehicle_location
  after insert on public.gps_events
  for each row execute function public.upsert_vehicle_location();

-- ============================================================================
-- RLS
-- ============================================================================
alter table public.gps_connections enable row level security;
alter table public.vehicle_devices enable row level security;
alter table public.gps_events enable row level security;
alter table public.vehicle_locations enable row level security;

create policy "org members can read gps connections" on public.gps_connections for select
  to authenticated using (organization_id = public.current_org_id());
create policy "admins can manage gps connections" on public.gps_connections for insert
  to authenticated with check (organization_id = public.current_org_id() and public.is_org_admin());
create policy "admins can update gps connections" on public.gps_connections for update
  to authenticated using (organization_id = public.current_org_id() and public.is_org_admin())
  with check (organization_id = public.current_org_id() and public.is_org_admin());

create policy "org members can read vehicle devices" on public.vehicle_devices for select
  to authenticated using (organization_id = public.current_org_id());
create policy "admins can manage vehicle devices" on public.vehicle_devices for insert
  to authenticated with check (organization_id = public.current_org_id() and public.is_org_admin());
create policy "admins can update vehicle devices" on public.vehicle_devices for update
  to authenticated using (organization_id = public.current_org_id() and public.is_org_admin())
  with check (organization_id = public.current_org_id() and public.is_org_admin());

create policy "org members can read gps events" on public.gps_events for select
  to authenticated using (organization_id = public.current_org_id());
create policy "org members can insert gps events" on public.gps_events for insert
  to authenticated with check (organization_id = public.current_org_id());

create policy "org members can read vehicle locations" on public.vehicle_locations for select
  to authenticated using (organization_id = public.current_org_id());
