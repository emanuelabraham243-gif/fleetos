-- ============================================================================
-- Trip fields Phase 4's New Trip / Trip Overview spec needs that Phase 1
-- had no use for yet: a direct client reference (a trip doesn't always
-- come from a contract), cargo details, a reference number, and a
-- customer-facing note distinct from the existing internal `notes`.
-- ============================================================================
alter table public.trips add column client_id uuid references public.clients (id) on delete set null;
alter table public.trips add column cargo_description text;
alter table public.trips add column cargo_quantity numeric(10, 2) check (cargo_quantity is null or cargo_quantity >= 0);
alter table public.trips add column cargo_quantity_unit text;
alter table public.trips add column cargo_weight_kg numeric(10, 1) check (cargo_weight_kg is null or cargo_weight_kg >= 0);
alter table public.trips add column reference_number text;
alter table public.trips add column customer_notes text;

create index trips_client_id_idx on public.trips (client_id);

-- ============================================================================
-- Trips didn't get the Phase 1 audit trigger because trips weren't part
-- of the original "financial/evidentiary" list -- Phase 4 makes every
-- status/assignment/cargo change auditable, so it's attached now using
-- the exact same trigger function everything else already uses.
-- ============================================================================
create trigger audit_changes
  after update or delete on public.trips
  for each row execute function public.record_audit_event();
