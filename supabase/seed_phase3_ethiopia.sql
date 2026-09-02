-- ============================================================================
-- Phase 3 seed correction: re-anchors the Phase 1/2 demo data on an
-- Ethiopian transport operation instead of a generic US one, and adds
-- enough historical data (trips, fuel, expenses, an incident, documents,
-- driver assignments) that every Vehicle Detail tab has something real to
-- show on at least some vehicles.
--
-- This is a DATA correction only -- no architecture changes. GPS
-- coordinates still come from the same mock provider (now anchored on
-- Addis Ababa); all figures (fuel prices, distances) are fictional demo
-- values, not sourced from any real pricing or logistics data.
-- ============================================================================
do $$
declare
  v_org_id uuid;
  v_owner_id uuid;

  v_vehicle_101 uuid := 'a4e7b051-3c5c-4130-a38b-371777e65fd7';
  v_vehicle_102 uuid := '4e9b3c34-b986-48dd-ba56-ef389c97f302';
  v_vehicle_103 uuid := 'eb92c718-7015-44ae-a8dd-07f40f948ce5';
  v_vehicle_104 uuid := '1b846c7f-8bfd-4def-a58a-cc897364ff8e';

  v_driver_abebe uuid := '01ec1249-2e4a-47d4-a891-b908e1696b25'; -- Abebe Kebede
  v_driver_dawit uuid := '1ed8dced-2728-4468-9d5c-bd8dcd7a2e04'; -- was John Carter
  v_driver_getachew uuid := 'faaef90e-89ec-4aa4-ad66-dd3c1ee9e640'; -- was Maria Gomez
  v_driver_henok uuid := '41d93abf-ddcf-4e17-9e1a-74a89bd533a4'; -- was David Okafor
  v_driver_samuel uuid := '92bb16ec-97f9-4f66-9aa4-1a67755d8a83'; -- Samuel Bekele

  v_device_101 uuid;
  v_device_102 uuid;
  v_device_103 uuid;

  v_trip_003 uuid;
begin
  select id into v_org_id from public.organizations where slug = 'fleetos-demo-logistics';
  select id into v_owner_id from public.profiles where organization_id = v_org_id and role = 'owner';

  select vd.id into v_device_101 from public.vehicle_devices vd where vd.vehicle_id = v_vehicle_101;
  select vd.id into v_device_102 from public.vehicle_devices vd where vd.vehicle_id = v_vehicle_102;
  select vd.id into v_device_103 from public.vehicle_devices vd where vd.vehicle_id = v_vehicle_103;

  -- ------------------------------------------------------------------------
  -- Drivers: rename to fictional Ethiopian demo names, Ethiopian phone
  -- format. IDs are unchanged, so every existing reference (the active
  -- trip, RLS, etc.) keeps working.
  -- ------------------------------------------------------------------------
  update public.drivers set
    full_name = 'Dawit Tesfaye', email = 'dawit.tesfaye@fleetos-demo.dev',
    phone = '+251-91-234-5678', license_number = 'ET-DL-88213'
  where id = v_driver_dawit;

  update public.drivers set
    full_name = 'Getachew Alemu', email = 'getachew.alemu@fleetos-demo.dev',
    phone = '+251-92-345-6789', license_number = 'ET-DL-77410'
  where id = v_driver_getachew;

  update public.drivers set
    full_name = 'Henok Girma', email = 'henok.girma@fleetos-demo.dev',
    phone = '+251-93-456-7890', license_number = 'ET-DL-65599'
  where id = v_driver_henok;

  update public.drivers set
    phone = '+251-94-567-8901', license_number = 'ET-DL-52207'
  where id = v_driver_samuel;

  update public.drivers set
    phone = '+251-91-122-3344', license_number = 'ET-DL-91045'
  where id = v_driver_abebe;

  -- ------------------------------------------------------------------------
  -- Vehicles: Ethiopian-style plates and commercial trucks actually common
  -- in Ethiopian freight (Isuzu, Sinotruk, FAW) instead of US-market makes.
  -- ------------------------------------------------------------------------
  update public.vehicles set
    make = 'Isuzu', model = 'FVR', license_plate = '3-12345',
    vin = 'JALFVR119K7010234', capacity_kg = 8000, engine_number = 'ISZ-4HK1-00123'
  where id = v_vehicle_101;

  update public.vehicles set
    make = 'Sinotruk', model = 'Howo', license_plate = '3-20456',
    vin = 'LZZ5CLSC5LN123456', capacity_kg = 10000, engine_number = 'SINO-WD615-00456'
  where id = v_vehicle_102;

  update public.vehicles set
    make = 'FAW', model = 'J6', license_plate = '3-33890',
    vin = 'LFY5EXAA1JA678901', capacity_kg = 9000, engine_number = 'FAW-CA6DL-00789'
  where id = v_vehicle_103;

  update public.vehicles set
    make = 'Isuzu', model = 'FVR', license_plate = '3-45231',
    vin = 'JALFVR121M7045678', capacity_kg = 8000, engine_number = 'ISZ-4HK1-00987'
  where id = v_vehicle_104;

  -- ------------------------------------------------------------------------
  -- Fresh GPS fixes, relocated to Ethiopia. Unit 101 en route south near
  -- Adama (matches its active Addis Ababa -> Hawassa trip); 102 parked at
  -- the Addis depot; 103 last seen near Bishoftu before it went into the
  -- shop. All flagged `demo: true` in raw_payload -- this is simulated
  -- data, never presented as a real-world feed.
  -- ------------------------------------------------------------------------
  insert into public.gps_events (
    organization_id, vehicle_device_id, vehicle_id, recorded_at,
    latitude, longitude, speed_kph, heading_degrees, ignition_on, odometer_km,
    movement_state, raw_payload
  ) values
  (v_org_id, v_device_101, v_vehicle_101, now() - interval '2 minutes',
   8.5400, 39.2700, 72.0, 170.0, true, 214520.1, 'moving',
   jsonb_build_object('source', 'seed_phase3', 'demo', true, 'note', 'near Adama, en route to Hawassa')),
  (v_org_id, v_device_102, v_vehicle_102, now() - interval '15 minutes',
   9.0300, 38.7400, 0, 0, false, 178305.2, 'stationary',
   jsonb_build_object('source', 'seed_phase3', 'demo', true, 'note', 'Addis Ababa depot')),
  (v_org_id, v_device_103, v_vehicle_103, now() - interval '90 minutes',
   8.7500, 38.9800, 0, 90.0, false, 261920.3, 'stationary',
   jsonb_build_object('source', 'seed_phase3', 'demo', true, 'note', 'near Bishoftu, last signal before maintenance'));

  -- ------------------------------------------------------------------------
  -- Historical trips across real Ethiopian corridors, for status/route
  -- variety (TR-001 from Phase 2 -- Addis Ababa -> Hawassa -- is untouched).
  -- ------------------------------------------------------------------------
  insert into public.trips (
    organization_id, vehicle_id, driver_id, trip_number, status,
    origin, destination, scheduled_start, actual_start, actual_end, distance_km
  ) values (
    v_org_id, v_vehicle_102, v_driver_getachew, 'TR-002', 'COMPLETED',
    'Addis Ababa', 'Adama',
    now() - interval '4 days', now() - interval '4 days' + interval '1 hour',
    now() - interval '4 days' + interval '3 hours', 99
  );

  insert into public.trips (
    organization_id, vehicle_id, driver_id, trip_number, status,
    origin, destination, scheduled_start, actual_start, actual_end, distance_km
  ) values (
    v_org_id, v_vehicle_103, v_driver_henok, 'TR-003', 'COMPLETED',
    'Addis Ababa', 'Dire Dawa',
    now() - interval '10 days', now() - interval '10 days' + interval '1 hour',
    now() - interval '10 days' + interval '9 hours', 445
  )
  returning id into v_trip_003;

  insert into public.trips (
    organization_id, vehicle_id, driver_id, trip_number, status,
    origin, destination, scheduled_start, actual_start, actual_end, distance_km
  ) values (
    v_org_id, v_vehicle_104, v_driver_dawit, 'TR-004', 'COMPLETED',
    'Addis Ababa', 'Bishoftu',
    now() - interval '2 days', now() - interval '2 days' + interval '1 hour',
    now() - interval '2 days' + interval '2 hours', 47
  );

  insert into public.trips (
    organization_id, vehicle_id, driver_id, trip_number, status,
    origin, destination, scheduled_start
  ) values (
    v_org_id, v_vehicle_101, v_driver_samuel, 'TR-005', 'CANCELLED',
    'Mojo', 'Addis Ababa', now() - interval '6 days'
  );

  -- ------------------------------------------------------------------------
  -- Fuel transactions -- Ethiopian Birr, fictional demo pricing.
  -- ------------------------------------------------------------------------
  insert into public.fuel_transactions (
    organization_id, vehicle_id, driver_id, occurred_at, odometer_km,
    volume_liters, price_per_liter, total_amount, currency, vendor_name
  ) values
  (v_org_id, v_vehicle_101, v_driver_abebe, now() - interval '2 hours', 214000,
   150, 65.00, 9750.00, 'ETB', 'NOC Fuel Station - Mojo'),
  (v_org_id, v_vehicle_101, v_driver_abebe, now() - interval '6 days', 213500,
   140, 64.50, 9030.00, 'ETB', 'TotalEnergies - Adama'),
  (v_org_id, v_vehicle_102, v_driver_getachew, now() - interval '4 days' + interval '30 minutes', 178100,
   120, 65.00, 7800.00, 'ETB', 'Oil Libya - Addis Ababa'),
  (v_org_id, v_vehicle_103, v_driver_henok, now() - interval '10 days' + interval '30 minutes', 261500,
   200, 64.00, 12800.00, 'ETB', 'NOC Fuel Station - Dire Dawa'),
  (v_org_id, v_vehicle_104, v_driver_dawit, now() - interval '2 days' + interval '30 minutes', 92000,
   60, 65.50, 3930.00, 'ETB', 'TotalEnergies - Bishoftu');

  -- ------------------------------------------------------------------------
  -- Expenses -- Ethiopian Birr, exercising the newly-added parts/tires
  -- categories.
  -- ------------------------------------------------------------------------
  insert into public.expenses (
    organization_id, vehicle_id, category, occurred_at, amount, currency, vendor_name, description
  ) values
  (v_org_id, v_vehicle_101, 'toll', now() - interval '2 hours', 150, 'ETB', 'Mojo Toll Station', 'Highway toll'),
  (v_org_id, v_vehicle_103, 'parts', now() - interval '3 days', 8500, 'ETB', 'Ethio Truck Parts PLC', 'Replacement brake pads'),
  (v_org_id, v_vehicle_103, 'tires', now() - interval '3 days', 22000, 'ETB', 'Yetebaberut Tire Center', 'Two rear tires replaced');

  -- ------------------------------------------------------------------------
  -- Incident: evidence-based fact, no accusation, tied to the trip and
  -- driver actually on the vehicle at the time.
  -- ------------------------------------------------------------------------
  insert into public.incidents (
    organization_id, vehicle_id, driver_id, trip_id, incident_type, severity, status,
    occurred_at, reported_at, location, description
  ) values (
    v_org_id, v_vehicle_103, v_driver_henok, v_trip_003, 'mechanical', 'medium', 'resolved',
    now() - interval '10 days' + interval '8 hours', now() - interval '10 days' + interval '8 hours 10 minutes',
    'Near Dire Dawa',
    'Engine coolant temperature warning activated during trip TR-003. Vehicle was brought in for inspection and scheduled maintenance on return to Addis Ababa.'
  );

  -- ------------------------------------------------------------------------
  -- Documents -- adds status variety (Valid / Expiring soon / Expired)
  -- alongside the Phase 2 insurance document for unit 101.
  -- ------------------------------------------------------------------------
  insert into public.vehicle_documents (organization_id, vehicle_id, document_type, status, issued_at, expires_at)
  values
  (v_org_id, v_vehicle_102, 'registration', 'active', current_date - 300, current_date + 200),
  (v_org_id, v_vehicle_103, 'insurance', 'active', current_date - 370, current_date - 10),
  (v_org_id, v_vehicle_104, 'inspection_certificate', 'active', current_date - 345, current_date + 20);

  -- ------------------------------------------------------------------------
  -- Persistent driver assignments, consistent with each vehicle's trip
  -- history above. Append-only: nothing here will ever be deleted, only
  -- closed out by a later assignment.
  -- ------------------------------------------------------------------------
  insert into public.vehicle_driver_assignments (organization_id, vehicle_id, driver_id, assigned_by, assigned_at)
  values
  (v_org_id, v_vehicle_101, v_driver_abebe, v_owner_id, now() - interval '30 days'),
  (v_org_id, v_vehicle_102, v_driver_getachew, v_owner_id, now() - interval '20 days'),
  (v_org_id, v_vehicle_103, v_driver_henok, v_owner_id, now() - interval '15 days'),
  (v_org_id, v_vehicle_104, v_driver_dawit, v_owner_id, now() - interval '10 days');
end $$;
