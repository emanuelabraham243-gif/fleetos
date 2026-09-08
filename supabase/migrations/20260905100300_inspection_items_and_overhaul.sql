-- ============================================================================
-- inspections already existed (Phase 1) but had no rows and no real UI, so
-- its type enum is recreated to match the spec's 7 inspection types exactly
-- (dropping 'periodic'/'annual', which were never used) rather than
-- extended. `passed boolean` is replaced by a 4-state `overall_result` --
-- PASSED/FAILED/PARTIAL/UNKNOWN can't be represented by a boolean, and the
-- spec is explicit that UNKNOWN must exist (an inspector who genuinely
-- doesn't know is not the same fact as a pass). inspector_id is the person
-- who conducted the inspection, kept distinct from driver_id (the driver
-- present, not necessarily the one checking items).
-- ============================================================================

alter table public.inspections drop column passed;

alter table public.inspections alter column inspection_type drop default;
alter table public.inspections alter column inspection_type type text using inspection_type::text;
drop type public.inspection_type;
create type public.inspection_type as enum (
  'pre_trip', 'post_trip', 'routine', 'maintenance', 'safety', 'damage', 'return_to_service'
);
alter table public.inspections
  alter column inspection_type type public.inspection_type using inspection_type::public.inspection_type;

create type public.inspection_overall_result as enum ('PASSED', 'FAILED', 'PARTIAL', 'UNKNOWN');

alter table public.inspections
  add column inspector_id uuid references public.profiles (id) on delete set null,
  add column overall_result public.inspection_overall_result not null default 'UNKNOWN';

create index inspections_inspector_id_idx on public.inspections (inspector_id);

-- ============================================================================
-- Checklist items are genuinely new -- inspections had no way to record
-- individual line items before. Category/item_name are free text (the spec
-- calls for the checklist to be "configurable later"; the default set for
-- each inspection type lives in application code for now, not a schema
-- table, since nothing yet needs it to be end-user editable). UNKNOWN is a
-- first-class result, never defaulted away from -- an inspector who didn't
-- check something records that fact, not a guessed pass or fail. severity
-- reuses maintenance_issue_severity so a failed item and the issue it might
-- create speak the same vocabulary. created_issue_id is set only when
-- "Create Maintenance Issue" was actually used from this item.
-- ============================================================================
create type public.inspection_item_result as enum ('PASS', 'FAIL', 'NOT_APPLICABLE', 'UNKNOWN');

create table public.inspection_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  inspection_id uuid not null references public.inspections (id) on delete cascade,
  category text not null,
  item_name text not null,
  result public.inspection_item_result not null default 'UNKNOWN',
  note text,
  severity public.maintenance_issue_severity,
  created_issue_id uuid references public.maintenance_issues (id) on delete set null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index inspection_items_organization_id_idx on public.inspection_items (organization_id);
create index inspection_items_inspection_id_idx on public.inspection_items (inspection_id);

create trigger set_updated_at
  before update on public.inspection_items
  for each row execute function set_updated_at();

alter table public.inspection_items enable row level security;

create policy "org members can read inspection items"
  on public.inspection_items for select
  using (organization_id = current_org_id());

create policy "org members can write inspection items"
  on public.inspection_items for all
  with check (organization_id = current_org_id());
