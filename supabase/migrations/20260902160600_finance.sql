-- ============================================================================
-- Financial and evidentiary records below share one rule: they are never
-- hard-deleted. There is deliberately no DELETE policy for `authenticated`
-- on any of them -- a mistake gets voided or corrected, never erased, and
-- every UPDATE is captured in audit_logs via record_audit_event().
-- ============================================================================

-- ============================================================================
-- fuel_transactions
-- ============================================================================
create table public.fuel_transactions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  vehicle_id uuid not null references public.vehicles (id) on delete restrict,
  driver_id uuid references public.drivers (id) on delete set null,
  occurred_at timestamptz not null,
  odometer_km numeric(10, 1) check (odometer_km is null or odometer_km >= 0),
  volume_liters numeric(8, 2) not null check (volume_liters > 0),
  price_per_liter numeric(8, 4) check (price_per_liter is null or price_per_liter >= 0),
  total_amount numeric(12, 2) not null check (total_amount >= 0),
  currency text not null default 'USD',
  vendor_name text,
  receipt_url text,
  status public.record_state not null default 'active',
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index fuel_transactions_organization_id_idx on public.fuel_transactions (organization_id);
create index fuel_transactions_vehicle_id_idx on public.fuel_transactions (vehicle_id, occurred_at desc);

create trigger set_updated_at
  before update on public.fuel_transactions
  for each row execute function public.set_updated_at();
create trigger audit_changes
  after update or delete on public.fuel_transactions
  for each row execute function public.record_audit_event();

-- ============================================================================
-- expenses
-- ============================================================================
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  vehicle_id uuid references public.vehicles (id) on delete set null,
  driver_id uuid references public.drivers (id) on delete set null,
  category public.expense_category not null default 'other',
  occurred_at timestamptz not null,
  amount numeric(12, 2) not null check (amount >= 0),
  currency text not null default 'USD',
  vendor_name text,
  receipt_url text,
  description text,
  status public.record_state not null default 'active',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index expenses_organization_id_idx on public.expenses (organization_id, occurred_at desc);

create trigger set_updated_at
  before update on public.expenses
  for each row execute function public.set_updated_at();
create trigger audit_changes
  after update or delete on public.expenses
  for each row execute function public.record_audit_event();

-- ============================================================================
-- revenues
-- ============================================================================
create table public.revenues (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  client_id uuid references public.clients (id) on delete set null,
  contract_id uuid references public.contracts (id) on delete set null,
  trip_id uuid references public.trips (id) on delete set null,
  occurred_at timestamptz not null,
  amount numeric(12, 2) not null check (amount >= 0),
  currency text not null default 'USD',
  description text,
  status public.record_state not null default 'active',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index revenues_organization_id_idx on public.revenues (organization_id, occurred_at desc);

create trigger set_updated_at
  before update on public.revenues
  for each row execute function public.set_updated_at();
create trigger audit_changes
  after update or delete on public.revenues
  for each row execute function public.record_audit_event();

-- ============================================================================
-- invoices
-- ============================================================================
create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete restrict,
  invoice_number text not null,
  status public.invoice_status not null default 'draft',
  issue_date date not null default current_date,
  due_date date,
  subtotal_amount numeric(12, 2) not null default 0 check (subtotal_amount >= 0),
  tax_amount numeric(12, 2) not null default 0 check (tax_amount >= 0),
  total_amount numeric(12, 2) not null default 0 check (total_amount >= 0),
  currency text not null default 'USD',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, invoice_number),
  check (due_date is null or due_date >= issue_date)
);

create index invoices_organization_id_idx on public.invoices (organization_id);
create index invoices_client_id_idx on public.invoices (client_id);
create index invoices_status_idx on public.invoices (organization_id, status);

create trigger set_updated_at
  before update on public.invoices
  for each row execute function public.set_updated_at();
create trigger audit_changes
  after update or delete on public.invoices
  for each row execute function public.record_audit_event();

-- ============================================================================
-- payments
-- ============================================================================
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  invoice_id uuid references public.invoices (id) on delete set null,
  client_id uuid references public.clients (id) on delete set null,
  amount numeric(12, 2) not null check (amount >= 0),
  currency text not null default 'USD',
  method public.payment_method not null default 'bank_transfer',
  status public.record_state not null default 'active',
  paid_at timestamptz not null default now(),
  reference text,
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payments_organization_id_idx on public.payments (organization_id, paid_at desc);
create index payments_invoice_id_idx on public.payments (invoice_id);

create trigger set_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();
create trigger audit_changes
  after update or delete on public.payments
  for each row execute function public.record_audit_event();

-- ============================================================================
-- RLS -- select/insert/update only. No delete policy anywhere in this file.
-- ============================================================================
alter table public.fuel_transactions enable row level security;
alter table public.expenses enable row level security;
alter table public.revenues enable row level security;
alter table public.invoices enable row level security;
alter table public.payments enable row level security;

create policy "org members can read fuel transactions" on public.fuel_transactions for select
  to authenticated using (organization_id = public.current_org_id());
create policy "org members can write fuel transactions" on public.fuel_transactions for insert
  to authenticated with check (organization_id = public.current_org_id());
create policy "org members can update fuel transactions" on public.fuel_transactions for update
  to authenticated using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

create policy "org members can read expenses" on public.expenses for select
  to authenticated using (organization_id = public.current_org_id());
create policy "org members can write expenses" on public.expenses for insert
  to authenticated with check (organization_id = public.current_org_id());
create policy "org members can update expenses" on public.expenses for update
  to authenticated using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

create policy "org members can read revenues" on public.revenues for select
  to authenticated using (organization_id = public.current_org_id());
create policy "org members can write revenues" on public.revenues for insert
  to authenticated with check (organization_id = public.current_org_id());
create policy "org members can update revenues" on public.revenues for update
  to authenticated using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

create policy "org members can read invoices" on public.invoices for select
  to authenticated using (organization_id = public.current_org_id());
create policy "org members can write invoices" on public.invoices for insert
  to authenticated with check (organization_id = public.current_org_id());
create policy "org members can update invoices" on public.invoices for update
  to authenticated using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

create policy "org members can read payments" on public.payments for select
  to authenticated using (organization_id = public.current_org_id());
create policy "org members can write payments" on public.payments for insert
  to authenticated with check (organization_id = public.current_org_id());
create policy "org members can update payments" on public.payments for update
  to authenticated using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());
