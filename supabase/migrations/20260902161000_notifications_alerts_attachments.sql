-- ============================================================================
-- notifications: per-user inbox items.
-- ============================================================================
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  link_url text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_profile_id_idx on public.notifications (profile_id, is_read, created_at desc);

-- ============================================================================
-- alerts: system-surfaced anomalies. `kind` defaults to 'calculation' --
-- an alert is FleetOS noticing a number crossed a threshold, not FleetOS
-- accusing anyone of anything.
-- ============================================================================
create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  vehicle_id uuid references public.vehicles (id) on delete cascade,
  driver_id uuid references public.drivers (id) on delete cascade,
  alert_type public.alert_type not null,
  severity public.alert_severity not null default 'info',
  kind public.evidence_kind not null default 'calculation',
  status public.alert_status not null default 'open',
  title text not null,
  description text not null,
  triggered_at timestamptz not null default now(),
  acknowledged_at timestamptz,
  acknowledged_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index alerts_organization_id_idx on public.alerts (organization_id, status);
create index alerts_vehicle_id_idx on public.alerts (vehicle_id);

-- ============================================================================
-- attachments: generic file attachment for entities without a dedicated
-- document table (e.g. an inspection photo, a trip note scan).
-- ============================================================================
create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  entity_type text not null check (entity_type in (
    'vehicle', 'driver', 'trip', 'delivery', 'incident', 'dispute',
    'maintenance_issue', 'work_order', 'inspection', 'expense', 'fuel_transaction'
  )),
  entity_id uuid not null,
  file_url text not null,
  file_name text not null,
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  uploaded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index attachments_entity_idx on public.attachments (entity_type, entity_id);
create index attachments_organization_id_idx on public.attachments (organization_id);

alter table public.notifications enable row level security;
alter table public.alerts enable row level security;
alter table public.attachments enable row level security;

create policy "users can read their own notifications" on public.notifications for select
  to authenticated using (profile_id = auth.uid());
create policy "users can update their own notifications" on public.notifications for update
  to authenticated using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy "org members can read alerts" on public.alerts for select
  to authenticated using (organization_id = public.current_org_id());
create policy "org members can update alerts" on public.alerts for update
  to authenticated using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

create policy "org members can read attachments" on public.attachments for select
  to authenticated using (organization_id = public.current_org_id());
create policy "org members can write attachments" on public.attachments for insert
  to authenticated with check (organization_id = public.current_org_id());

-- ============================================================================
-- Retrofit audit triggers onto the remaining master-data tables that can
-- carry disputed history (vehicles, drivers get corrected, not silently
-- overwritten).
-- ============================================================================
create trigger audit_changes
  after update or delete on public.vehicles
  for each row execute function public.record_audit_event();
create trigger audit_changes
  after update or delete on public.drivers
  for each row execute function public.record_audit_event();
