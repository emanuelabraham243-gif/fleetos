-- ============================================================================
-- Replace the Phase 1 placeholder delivery_status with the full set Phase
-- 4 needs (real-world exceptions: partial, refused, damaged -- arrival and
-- delivery confirmation are distinct events, never conflated). `deliveries`
-- has zero rows in every environment this has been applied to, so this is
-- a clean swap, the same pattern used for trip_status in Phase 2.
-- ============================================================================
alter table public.deliveries alter column status drop default;
alter table public.deliveries alter column status type text using status::text;
drop type public.delivery_status;

create type public.delivery_status as enum (
  'PENDING',
  'IN_TRANSIT',
  'ARRIVED',
  'DELIVERED',
  'PARTIALLY_DELIVERED',
  'REFUSED',
  'DAMAGED',
  'CANCELLED'
);

alter table public.deliveries
  alter column status type public.delivery_status using status::public.delivery_status,
  alter column status set default 'PENDING';

-- ============================================================================
-- Fields the Delivery Detail / confirmation workflow needs: a proper
-- delivery identifier (distinct from the trip's own reference_number),
-- expected vs. actually-delivered quantity kept as two separate values
-- (never collapsed into one "delivered: yes/no"), who confirmed it, a
-- distinct arrival timestamp, and an evidence-based (not accusatory)
-- refusal reason.
-- ============================================================================
alter table public.deliveries add column delivery_number text;
alter table public.deliveries add column expected_quantity numeric(10, 2) check (expected_quantity is null or expected_quantity >= 0);
alter table public.deliveries add column delivered_quantity numeric(10, 2) check (delivered_quantity is null or delivered_quantity >= 0);
alter table public.deliveries add column quantity_unit text;
alter table public.deliveries add column arrived_at timestamptz;
alter table public.deliveries add column confirmed_by uuid references public.profiles (id) on delete set null;
alter table public.deliveries add column refusal_reason text;

alter table public.deliveries add constraint deliveries_organization_id_delivery_number_key unique (organization_id, delivery_number);

create trigger audit_changes
  after update or delete on public.deliveries
  for each row execute function public.record_audit_event();
