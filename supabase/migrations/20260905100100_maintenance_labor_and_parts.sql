-- ============================================================================
-- maintenance_parts already existed (Phase 1) but had no supplier/vendor
-- attribution or free-text notes, and no updated_at (only ever inserted,
-- never edited, so nothing needed it before). maintenance_labor is
-- genuinely new -- no equivalent existed anywhere in the schema.
-- ============================================================================

alter table public.maintenance_parts
  add column vendor_id uuid references public.vendors (id) on delete set null,
  add column notes text,
  add column updated_at timestamptz not null default now();

create trigger set_updated_at
  before update on public.maintenance_parts
  for each row execute function set_updated_at();

create index maintenance_parts_vendor_id_idx on public.maintenance_parts (vendor_id);

-- ============================================================================
-- Labor is either hourly (hours * rate) or a fixed charge -- never both,
-- and total_cost is always the one number the app actually computed,
-- mirroring maintenance_parts.total_cost (quantity * unit_cost) rather
-- than trusting a manually-typed total that could drift from the inputs.
-- technician_name covers an internal/informal technician with no vendor
-- record (Phase 6's "don't force a vendor record" principle); vendor_id
-- covers an external shop, reusing the existing vendors table.
-- ============================================================================
create table public.maintenance_labor (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  work_order_id uuid not null references public.work_orders (id) on delete cascade,
  vendor_id uuid references public.vendors (id) on delete set null,
  technician_name text,
  description text,
  hours numeric,
  rate numeric,
  fixed_amount numeric,
  total_cost numeric not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index maintenance_labor_organization_id_idx on public.maintenance_labor (organization_id);
create index maintenance_labor_work_order_id_idx on public.maintenance_labor (work_order_id);
create index maintenance_labor_vendor_id_idx on public.maintenance_labor (vendor_id);

create trigger set_updated_at
  before update on public.maintenance_labor
  for each row execute function set_updated_at();

alter table public.maintenance_labor enable row level security;

create policy "org members can read maintenance labor"
  on public.maintenance_labor for select
  using (organization_id = current_org_id());

create policy "org members can write maintenance labor"
  on public.maintenance_labor for all
  with check (organization_id = current_org_id());
