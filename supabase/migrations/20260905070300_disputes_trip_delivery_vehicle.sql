-- ============================================================================
-- Trips and deliveries need to connect to the existing disputes
-- architecture (Phase 1) rather than a new one: a dispute can now
-- reference the trip, delivery, and vehicle involved, alongside the
-- client/driver/incident references it already had.
-- ============================================================================
alter table public.disputes add column trip_id uuid references public.trips (id) on delete set null;
alter table public.disputes add column delivery_id uuid references public.deliveries (id) on delete set null;
alter table public.disputes add column vehicle_id uuid references public.vehicles (id) on delete set null;

create index disputes_trip_id_idx on public.disputes (trip_id);
create index disputes_delivery_id_idx on public.disputes (delivery_id);
create index disputes_vehicle_id_idx on public.disputes (vehicle_id);
