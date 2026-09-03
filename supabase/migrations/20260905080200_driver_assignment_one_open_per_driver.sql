-- Mirrors the existing vehicle-side guarantee (at most one open assignment
-- per vehicle) on the driver side too -- a driver should not simultaneously
-- have two open vehicle assignments. The app layer already closes out a
-- driver's other open assignment before opening a new one (see
-- assignVehicleToDriver), this is the database-level backstop.
create unique index vehicle_driver_assignments_driver_active_idx
  on public.vehicle_driver_assignments (driver_id)
  where (unassigned_at is null);
