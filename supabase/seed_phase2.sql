-- ============================================================================
-- Phase 2 seed patch: adds to the Phase 1 demo data (does not replace it).
-- Run once against a database that already has the Phase 1 seed applied.
--
-- Adds: 1 driver, 1 active trip (so "On Trip" / "Active Trips" have real
-- data), a near-expiry vehicle document and a near-due maintenance
-- schedule (so "Attention Required" has real evidence to show), and
-- fresh GPS events so the live/delayed/offline demo still holds at
-- whatever time this is reviewed (the Phase 1 seed's timestamps age past
-- their thresholds as real time passes).
-- ============================================================================
do $$
declare
  v_org_id uuid;
  v_vehicle_101 uuid;
  v_vehicle_102 uuid;
  v_vehicle_103 uuid;
  v_device_101 uuid;
  v_device_102 uuid;
  v_device_103 uuid;
  v_driver_kebede uuid;
begin
  select id into v_org_id from public.organizations where slug = 'fleetos-demo-logistics';

  select id into v_vehicle_101 from public.vehicles where organization_id = v_org_id and unit_number = '101';
  select id into v_vehicle_102 from public.vehicles where organization_id = v_org_id and unit_number = '102';
  select id into v_vehicle_103 from public.vehicles where organization_id = v_org_id and unit_number = '103';

  select vd.id into v_device_101 from public.vehicle_devices vd where vd.vehicle_id = v_vehicle_101;
  select vd.id into v_device_102 from public.vehicle_devices vd where vd.vehicle_id = v_vehicle_102;
  select vd.id into v_device_103 from public.vehicle_devices vd where vd.vehicle_id = v_vehicle_103;

  -- --------------------------------------------------------------------
  -- Driver + active trip. Vehicle 101 -> ON_TRIP; 102/103/104 keep their
  -- existing Phase 1 states (available / maintenance / offline).
  -- --------------------------------------------------------------------
  insert into public.drivers (organization_id, full_name, email, phone, license_number, license_class, license_expiry, status, hire_date)
  values (v_org_id, 'Abebe Kebede', 'abebe.kebede@fleetos-demo.dev', '+1-303-555-0110', 'CO-CDL-91045', 'A', '2027-09-01', 'active', '2023-01-10')
  returning id into v_driver_kebede;

  insert into public.trips (
    organization_id, vehicle_id, driver_id, trip_number, status,
    origin, destination, scheduled_start, actual_start
  ) values (
    v_org_id, v_vehicle_101, v_driver_kebede, 'TR-001', 'IN_TRANSIT',
    'Addis Ababa', 'Hawassa', now() - interval '3 hours', now() - interval '2 hours 50 minutes'
  );

  -- --------------------------------------------------------------------
  -- Attention-required evidence: a document nearing expiry and a
  -- maintenance schedule coming due -- both real, queryable facts.
  -- --------------------------------------------------------------------
  insert into public.vehicle_documents (organization_id, vehicle_id, document_type, status, issued_at, expires_at)
  values (v_org_id, v_vehicle_101, 'insurance', 'active', current_date - interval '11 months', current_date + interval '12 days');

  insert into public.maintenance_schedules (
    organization_id, vehicle_id, title, interval_km, interval_days, last_done_at, next_due_at, is_active
  ) values (
    v_org_id, v_vehicle_102, 'Oil and filter service', 15000, 90, current_date - interval '85 days', current_date + interval '5 days', true
  );

  -- --------------------------------------------------------------------
  -- Fresh GPS fixes -- re-establishes the live/delayed/offline spread
  -- relative to *now*, independent of when the Phase 1 seed originally ran.
  -- --------------------------------------------------------------------
  insert into public.gps_events (
    organization_id, vehicle_device_id, vehicle_id, recorded_at,
    latitude, longitude, speed_kph, heading_degrees, ignition_on, odometer_km,
    movement_state, raw_payload
  ) values
  (v_org_id, v_device_101, v_vehicle_101, now() - interval '2 minutes',
   39.739, -104.985, 91.4, 52.0, true, 214520.1, 'moving', '{"source":"seed_phase2"}'::jsonb),
  (v_org_id, v_device_102, v_vehicle_102, now() - interval '15 minutes',
   39.612, -105.021, 0, 12.0, false, 178305.2, 'stationary', '{"source":"seed_phase2"}'::jsonb),
  (v_org_id, v_device_103, v_vehicle_103, now() - interval '90 minutes',
   39.55, -104.72, 58.9, 200.5, true, 261920.3, 'moving', '{"source":"seed_phase2"}'::jsonb);
end $$;
