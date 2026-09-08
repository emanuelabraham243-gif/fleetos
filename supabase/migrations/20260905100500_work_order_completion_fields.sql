-- ============================================================================
-- Completing a work order needs three facts creation-time fields don't
-- cover: which recurring schedule (if any) this service fulfills -- the
-- missing link in the Vehicle -> Schedule -> Issue -> Work Order chain --
-- the odometer reading at completion (distinct from `odometer_km`, the
-- reading when the order was opened), and a narrative of what was
-- actually found/done, separate from `description` (the original plan).
-- ============================================================================
alter table public.work_orders
  add column maintenance_schedule_id uuid references public.maintenance_schedules (id) on delete set null,
  add column completion_odometer_km numeric,
  add column completion_notes text;

create index work_orders_maintenance_schedule_id_idx on public.work_orders (maintenance_schedule_id);
