-- ============================================================================
-- incidents: the `description` field records what happened, in the voice of
-- FACT/CALCULATION, never accusation ("GPS recorded speed above the
-- configured threshold at 14:32", not "driver was speeding"). The
-- distinction is enforced at the application layer; incident_evidence below
-- is what makes the distinction structural.
-- ============================================================================
create table public.incidents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  vehicle_id uuid references public.vehicles (id) on delete set null,
  driver_id uuid references public.drivers (id) on delete set null,
  trip_id uuid references public.trips (id) on delete set null,
  incident_type public.incident_type not null default 'other',
  severity public.incident_severity not null default 'low',
  status public.incident_status not null default 'open',
  occurred_at timestamptz not null,
  reported_at timestamptz not null default now(),
  location text,
  description text not null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index incidents_organization_id_idx on public.incidents (organization_id);
create index incidents_vehicle_id_idx on public.incidents (vehicle_id);
create index incidents_status_idx on public.incidents (organization_id, status);

create trigger set_updated_at
  before update on public.incidents
  for each row execute function public.set_updated_at();
create trigger audit_changes
  after update or delete on public.incidents
  for each row execute function public.record_audit_event();

-- ============================================================================
-- incident_evidence: every piece of supporting material is tagged with what
-- KIND of claim it is (fact / calculation / user_input / interpretation /
-- decision). This is what stops the system from collapsing "GPS logged a
-- number" and "we conclude the driver did X" into the same kind of
-- statement.
-- ============================================================================
create table public.incident_evidence (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  incident_id uuid not null references public.incidents (id) on delete cascade,
  kind public.evidence_kind not null,
  source public.evidence_source not null default 'other',
  content text not null,
  file_url text,
  recorded_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index incident_evidence_incident_id_idx on public.incident_evidence (incident_id);

-- ============================================================================
-- disputes
-- ============================================================================
create table public.disputes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  incident_id uuid references public.incidents (id) on delete set null,
  client_id uuid references public.clients (id) on delete set null,
  driver_id uuid references public.drivers (id) on delete set null,
  dispute_type public.dispute_type not null default 'other',
  status public.dispute_status not null default 'open',
  opened_at timestamptz not null default now(),
  resolved_at timestamptz,
  description text not null,
  resolution text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index disputes_organization_id_idx on public.disputes (organization_id);
create index disputes_status_idx on public.disputes (organization_id, status);

create trigger set_updated_at
  before update on public.disputes
  for each row execute function public.set_updated_at();
create trigger audit_changes
  after update or delete on public.disputes
  for each row execute function public.record_audit_event();

-- ============================================================================
-- RLS
-- ============================================================================
alter table public.incidents enable row level security;
alter table public.incident_evidence enable row level security;
alter table public.disputes enable row level security;

create policy "org members can read incidents" on public.incidents for select
  to authenticated using (organization_id = public.current_org_id());
create policy "org members can write incidents" on public.incidents for insert
  to authenticated with check (organization_id = public.current_org_id());
create policy "org members can update incidents" on public.incidents for update
  to authenticated using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

create policy "org members can read incident evidence" on public.incident_evidence for select
  to authenticated using (organization_id = public.current_org_id());
create policy "org members can write incident evidence" on public.incident_evidence for insert
  to authenticated with check (organization_id = public.current_org_id());

create policy "org members can read disputes" on public.disputes for select
  to authenticated using (organization_id = public.current_org_id());
create policy "org members can write disputes" on public.disputes for insert
  to authenticated with check (organization_id = public.current_org_id());
create policy "org members can update disputes" on public.disputes for update
  to authenticated using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());
