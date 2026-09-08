-- ============================================================================
-- Phase 7: maintenance_issues and work_orders already existed (Phase 1) but
-- had no real UI and no rows, so their status enums are recreated here to
-- match the spec's full lifecycle rather than being extended piecemeal --
-- the same "clean recreate while the table is still empty" approach Phase 5
-- used for driver_status. Both tables are confirmed empty before this runs.
-- ============================================================================

-- ---- maintenance_issues ----

alter table public.maintenance_issues alter column status drop default;
alter table public.maintenance_issues alter column status type text using status::text;
drop type public.maintenance_issue_status;
create type public.maintenance_issue_status as enum (
  'REPORTED', 'ACKNOWLEDGED', 'UNDER_DIAGNOSIS', 'WORK_ORDER_CREATED', 'RESOLVED', 'CLOSED', 'DISMISSED'
);
alter table public.maintenance_issues
  alter column status type public.maintenance_issue_status using status::public.maintenance_issue_status,
  alter column status set default 'REPORTED';

create type public.maintenance_issue_type as enum (
  'engine', 'transmission', 'brakes', 'tires', 'electrical', 'cooling', 'suspension', 'body', 'gps', 'fuel_system', 'other'
);

alter table public.maintenance_issues
  add column issue_type public.maintenance_issue_type not null,
  add column driver_id uuid references public.drivers (id) on delete set null,
  add column odometer_km numeric,
  add column dismissed_reason text;

create index maintenance_issues_driver_id_idx on public.maintenance_issues (driver_id);

-- ---- work_orders ----
-- recent_activity_feed's MAINTENANCE_COMPLETED branch reads work_orders.status,
-- so the view has to be dropped before the column's type changes and
-- recreated after, with the same definition except the new enum value.

drop view public.recent_activity_feed;

alter table public.work_orders alter column status drop default;
alter table public.work_orders alter column status type text using status::text;
drop type public.work_order_status;
create type public.work_order_status as enum (
  'DRAFT', 'APPROVED', 'ASSIGNED', 'DIAGNOSIS', 'AWAITING_PARTS', 'IN_REPAIR', 'INSPECTION', 'COMPLETED', 'CANCELLED'
);
alter table public.work_orders
  alter column status type public.work_order_status using status::public.work_order_status,
  alter column status set default 'DRAFT';

create type public.work_order_priority as enum ('LOW', 'NORMAL', 'HIGH', 'CRITICAL');
create type public.maintenance_type as enum ('PREVENTIVE', 'CORRECTIVE', 'INSPECTION', 'EMERGENCY');

alter table public.work_orders
  add column priority public.work_order_priority not null default 'NORMAL',
  add column maintenance_type public.maintenance_type not null default 'CORRECTIVE',
  add column assigned_to uuid references public.profiles (id) on delete set null,
  add column started_at timestamptz,
  add column odometer_km numeric,
  add column estimated_cost numeric,
  add column estimated_completion_at timestamptz,
  add column downtime_start_at timestamptz,
  add column downtime_end_at timestamptz;

create index work_orders_assigned_to_idx on public.work_orders (assigned_to);

create view public.recent_activity_feed with (security_invoker = true) as
  select 'TRIP_STATUS_CHANGED'::text as event_type,
    t.organization_id, t.id as record_id, t.vehicle_id, t.driver_id, t.updated_at as occurred_at,
    jsonb_build_object('trip_number', t.trip_number, 'status', t.status) as details
  from trips t
  union all
  select 'FUEL_RECORDED'::text as event_type,
    f.organization_id, f.id as record_id, f.vehicle_id, f.driver_id, f.created_at as occurred_at,
    jsonb_build_object('volume_liters', f.volume_liters, 'total_amount', f.total_amount, 'currency', f.currency) as details
  from fuel_transactions f
  union all
  select 'GPS_UPDATED'::text as event_type,
    vl.organization_id, vl.vehicle_id as record_id, vl.vehicle_id, null::uuid as driver_id, vl.updated_at as occurred_at,
    jsonb_build_object('movement_state', vl.movement_state, 'speed_kph', vl.speed_kph) as details
  from vehicle_locations vl
  union all
  select 'MAINTENANCE_COMPLETED'::text as event_type,
    w.organization_id, w.id as record_id, w.vehicle_id, null::uuid as driver_id, w.closed_at as occurred_at,
    jsonb_build_object('title', w.title, 'total_cost', w.total_cost) as details
  from work_orders w
  where w.status = 'COMPLETED'::work_order_status and w.closed_at is not null;
