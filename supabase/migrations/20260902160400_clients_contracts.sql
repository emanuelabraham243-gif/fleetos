-- ============================================================================
-- clients
-- ============================================================================
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  contact_name text,
  email text,
  phone text,
  billing_address text,
  notes text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index clients_organization_id_idx on public.clients (organization_id) where archived_at is null;

create trigger set_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();

-- ============================================================================
-- contracts
-- ============================================================================
create table public.contracts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete restrict,
  contract_number text not null,
  title text not null,
  rate_type public.contract_rate_type not null default 'flat',
  rate_amount numeric(12, 2) check (rate_amount is null or rate_amount >= 0),
  status public.contract_status not null default 'draft',
  start_date date,
  end_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, contract_number),
  check (end_date is null or start_date is null or end_date >= start_date)
);

create index contracts_organization_id_idx on public.contracts (organization_id);
create index contracts_client_id_idx on public.contracts (client_id);

create trigger set_updated_at
  before update on public.contracts
  for each row execute function public.set_updated_at();

alter table public.clients enable row level security;
alter table public.contracts enable row level security;

create policy "org members can read clients" on public.clients for select
  to authenticated using (organization_id = public.current_org_id());
create policy "org members can write clients" on public.clients for insert
  to authenticated with check (organization_id = public.current_org_id());
create policy "org members can update clients" on public.clients for update
  to authenticated using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

create policy "org members can read contracts" on public.contracts for select
  to authenticated using (organization_id = public.current_org_id());
create policy "org members can write contracts" on public.contracts for insert
  to authenticated with check (organization_id = public.current_org_id());
create policy "org members can update contracts" on public.contracts for update
  to authenticated using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());
