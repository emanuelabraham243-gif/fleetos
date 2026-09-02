-- ============================================================================
-- recent_activity_feed: one reusable source for the Command Center's
-- activity timeline instead of separate ad-hoc queries per event type.
--
-- `security_invoker = true` means this view carries no privileges of its
-- own -- it evaluates entirely as the querying user, so the RLS policies
-- already on trips/fuel_transactions/vehicle_locations/work_orders are
-- what actually scope it to the caller's organization. No new RLS surface
-- to maintain here.
--
-- `event_type` is a language-neutral token (never English prose); `details`
-- carries only structured facts. The human-readable sentence is built by
-- the application layer, which is also where a future English/Amharic
-- switch would plug in -- never bake display text into the database.
-- ============================================================================
create view public.recent_activity_feed
with (security_invoker = true)
as
  select
    'TRIP_STATUS_CHANGED'::text as event_type,
    t.organization_id,
    t.id as record_id,
    t.vehicle_id,
    t.driver_id,
    t.updated_at as occurred_at,
    jsonb_build_object('trip_number', t.trip_number, 'status', t.status) as details
  from public.trips t

  union all

  select
    'FUEL_RECORDED',
    f.organization_id,
    f.id,
    f.vehicle_id,
    f.driver_id,
    f.created_at,
    jsonb_build_object(
      'volume_liters', f.volume_liters,
      'total_amount', f.total_amount,
      'currency', f.currency
    )
  from public.fuel_transactions f

  union all

  select
    'GPS_UPDATED',
    vl.organization_id,
    vl.vehicle_id,
    vl.vehicle_id,
    null::uuid,
    vl.updated_at,
    jsonb_build_object('movement_state', vl.movement_state, 'speed_kph', vl.speed_kph)
  from public.vehicle_locations vl

  union all

  select
    'MAINTENANCE_COMPLETED',
    w.organization_id,
    w.id,
    w.vehicle_id,
    null::uuid,
    w.closed_at,
    jsonb_build_object('title', w.title, 'total_cost', w.total_cost)
  from public.work_orders w
  where w.status = 'completed' and w.closed_at is not null;
