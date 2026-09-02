-- ============================================================================
-- vehicle_documents
-- ============================================================================
create table public.vehicle_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  document_type public.document_type_vehicle not null,
  status public.document_status not null default 'active',
  file_url text,
  issued_at date,
  expires_at date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index vehicle_documents_vehicle_id_idx on public.vehicle_documents (vehicle_id);
create index vehicle_documents_expires_at_idx on public.vehicle_documents (organization_id, expires_at);

create trigger set_updated_at
  before update on public.vehicle_documents
  for each row execute function public.set_updated_at();

-- ============================================================================
-- driver_documents
-- ============================================================================
create table public.driver_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  driver_id uuid not null references public.drivers (id) on delete cascade,
  document_type public.document_type_driver not null,
  status public.document_status not null default 'active',
  file_url text,
  issued_at date,
  expires_at date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index driver_documents_driver_id_idx on public.driver_documents (driver_id);
create index driver_documents_expires_at_idx on public.driver_documents (organization_id, expires_at);

create trigger set_updated_at
  before update on public.driver_documents
  for each row execute function public.set_updated_at();

-- ============================================================================
-- contract_documents
-- ============================================================================
create table public.contract_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  contract_id uuid not null references public.contracts (id) on delete cascade,
  title text not null,
  file_url text not null,
  uploaded_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index contract_documents_contract_id_idx on public.contract_documents (contract_id);

alter table public.vehicle_documents enable row level security;
alter table public.driver_documents enable row level security;
alter table public.contract_documents enable row level security;

create policy "org members can read vehicle documents" on public.vehicle_documents for select
  to authenticated using (organization_id = public.current_org_id());
create policy "org members can write vehicle documents" on public.vehicle_documents for insert
  to authenticated with check (organization_id = public.current_org_id());
create policy "org members can update vehicle documents" on public.vehicle_documents for update
  to authenticated using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

create policy "org members can read driver documents" on public.driver_documents for select
  to authenticated using (organization_id = public.current_org_id());
create policy "org members can write driver documents" on public.driver_documents for insert
  to authenticated with check (organization_id = public.current_org_id());
create policy "org members can update driver documents" on public.driver_documents for update
  to authenticated using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

create policy "org members can read contract documents" on public.contract_documents for select
  to authenticated using (organization_id = public.current_org_id());
create policy "org members can write contract documents" on public.contract_documents for insert
  to authenticated with check (organization_id = public.current_org_id());
