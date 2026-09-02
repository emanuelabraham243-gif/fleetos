-- ============================================================================
-- Demo seed data for one organization: a small trucking business running
-- 4 vehicles. Run against a fresh database with all migrations applied.
-- Idempotent-ish: re-running raises a unique-violation on the org slug
-- rather than silently duplicating data.
--
-- Demo login credentials (change or remove before any real production use):
--   owner@fleetos-demo.dev      / FleetOS-Demo1!  (role: owner)
--   dispatch@fleetos-demo.dev   / FleetOS-Demo1!  (role: dispatcher)
-- ============================================================================
do $$
declare
  v_org_id uuid;
  v_owner_id uuid := gen_random_uuid();
  v_dispatcher_id uuid := gen_random_uuid();
  v_mock_provider_id uuid;
  v_connection_id uuid;

  v_vehicle_101 uuid;
  v_vehicle_102 uuid;
  v_vehicle_103 uuid;
  v_vehicle_104 uuid;

  v_device_101 uuid;
  v_device_102 uuid;
  v_device_103 uuid;

  v_driver_carter uuid;
  v_driver_gomez uuid;

  v_password text := crypt('FleetOS-Demo1!', gen_salt('bf'));
begin
  -- ------------------------------------------------------------------------
  -- Organization
  -- ------------------------------------------------------------------------
  insert into public.organizations (name, slug, timezone)
  values ('FleetOS Demo Logistics', 'fleetos-demo-logistics', 'America/Denver')
  returning id into v_org_id;

  -- ------------------------------------------------------------------------
  -- Auth users. handle_new_user() picks up organization_id/full_name/role
  -- from raw_user_meta_data and creates the matching profiles row.
  -- ------------------------------------------------------------------------
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, last_sign_in_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    email_change_token_current, phone_change, phone_change_token, reauthentication_token,
    raw_app_meta_data, raw_user_meta_data,
    is_super_admin, is_sso_user, is_anonymous,
    created_at, updated_at
  ) values
  (
    '00000000-0000-0000-0000-000000000000', v_owner_id, 'authenticated', 'authenticated',
    'owner@fleetos-demo.dev', v_password, now(), now(),
    '', '', '', '', '', '', '', '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('organization_id', v_org_id, 'full_name', 'Alex Rivera', 'role', 'owner'),
    false, false, false, now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000', v_dispatcher_id, 'authenticated', 'authenticated',
    'dispatch@fleetos-demo.dev', v_password, now(), now(),
    '', '', '', '', '', '', '', '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('organization_id', v_org_id, 'full_name', 'Jordan Blake', 'role', 'dispatcher'),
    false, false, false, now(), now()
  );

  insert into auth.identities (
    id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  ) values
  (
    gen_random_uuid(), v_owner_id, v_owner_id::text,
    jsonb_build_object('sub', v_owner_id::text, 'email', 'owner@fleetos-demo.dev'),
    'email', now(), now(), now()
  ),
  (
    gen_random_uuid(), v_dispatcher_id, v_dispatcher_id::text,
    jsonb_build_object('sub', v_dispatcher_id::text, 'email', 'dispatch@fleetos-demo.dev'),
    'email', now(), now(), now()
  );

  -- ------------------------------------------------------------------------
  -- Vehicles -- 4 trucks, matching the business this org represents.
  -- ------------------------------------------------------------------------
  insert into public.vehicles (
    organization_id, unit_number, vin, make, model, year, license_plate,
    vehicle_type, status, fuel_type, color, odometer_km, purchased_at
  ) values
  (v_org_id, '101', '1FUJGLDR8KLKA1234', 'Freightliner', 'Cascadia', 2019, 'CO-40T101',
   'truck', 'active', 'diesel', 'White', 214500, '2019-03-14')
  returning id into v_vehicle_101;

  insert into public.vehicles (
    organization_id, unit_number, vin, make, model, year, license_plate,
    vehicle_type, status, fuel_type, color, odometer_km, purchased_at
  ) values
  (v_org_id, '102', '1XKAD49X8LJ456789', 'Kenworth', 'T680', 2020, 'CO-40T102',
   'truck', 'active', 'diesel', 'Blue', 178300, '2020-07-02')
  returning id into v_vehicle_102;

  insert into public.vehicles (
    organization_id, unit_number, vin, make, model, year, license_plate,
    vehicle_type, status, fuel_type, color, odometer_km, purchased_at
  ) values
  (v_org_id, '103', '1XPBD49X1JD234567', 'Peterbilt', '579', 2018, 'CO-40T103',
   'truck', 'maintenance', 'diesel', 'Red', 261900, '2018-11-20')
  returning id into v_vehicle_103;

  insert into public.vehicles (
    organization_id, unit_number, vin, make, model, year, license_plate,
    vehicle_type, status, fuel_type, color, odometer_km, purchased_at
  ) values
  (v_org_id, '104', '1FUJGLDR2MLKA9876', 'Freightliner', 'Cascadia', 2021, 'CO-40T104',
   'truck', 'active', 'diesel', 'White', 92100, '2021-05-09')
  returning id into v_vehicle_104;

  -- ------------------------------------------------------------------------
  -- Drivers
  -- ------------------------------------------------------------------------
  insert into public.drivers (
    organization_id, full_name, email, phone, license_number, license_class,
    license_expiry, status, hire_date
  ) values
  (v_org_id, 'John Carter', 'john.carter@fleetos-demo.dev', '+1-303-555-0101',
   'CO-CDL-88213', 'A', '2027-06-30', 'active', '2021-02-01')
  returning id into v_driver_carter;

  insert into public.drivers (
    organization_id, full_name, email, phone, license_number, license_class,
    license_expiry, status, hire_date
  ) values
  (v_org_id, 'Maria Gomez', 'maria.gomez@fleetos-demo.dev', '+1-303-555-0102',
   'CO-CDL-77410', 'A', '2026-11-15', 'active', '2020-09-14')
  returning id into v_driver_gomez;

  insert into public.drivers (
    organization_id, full_name, email, phone, license_number, license_class,
    license_expiry, status, hire_date
  ) values
  (v_org_id, 'David Okafor', 'david.okafor@fleetos-demo.dev', '+1-303-555-0103',
   'CO-CDL-65599', 'A', '2027-02-28', 'active', '2022-04-18');

  insert into public.drivers (
    organization_id, full_name, email, phone, license_number, license_class,
    license_expiry, status, hire_date, termination_date
  ) values
  (v_org_id, 'Samuel Bekele', 'samuel.bekele@fleetos-demo.dev', '+1-303-555-0104',
   'CO-CDL-52207', 'A', '2025-08-01', 'inactive', '2019-06-01', '2026-01-15');

  -- ------------------------------------------------------------------------
  -- GPS: one mock connection for the org, one device per vehicle, and
  -- events at staggered ages so all four status tiers are demonstrated:
  -- unit 101 -> LIVE, 102 -> DELAYED, 103 -> OFFLINE, 104 -> UNKNOWN (no device).
  -- ------------------------------------------------------------------------
  select id into v_mock_provider_id from public.gps_providers where slug = 'mock';

  insert into public.gps_connections (organization_id, gps_provider_id, name, status, config)
  values (v_org_id, v_mock_provider_id, 'Demo Mock Feed', 'active', '{}'::jsonb)
  returning id into v_connection_id;

  insert into public.vehicle_devices (organization_id, vehicle_id, gps_connection_id, external_device_id, serial_number)
  values (v_org_id, v_vehicle_101, v_connection_id, 'MOCK-101', 'SN-101')
  returning id into v_device_101;

  insert into public.vehicle_devices (organization_id, vehicle_id, gps_connection_id, external_device_id, serial_number)
  values (v_org_id, v_vehicle_102, v_connection_id, 'MOCK-102', 'SN-102')
  returning id into v_device_102;

  insert into public.vehicle_devices (organization_id, vehicle_id, gps_connection_id, external_device_id, serial_number)
  values (v_org_id, v_vehicle_103, v_connection_id, 'MOCK-103', 'SN-103')
  returning id into v_device_103;

  -- Unit 104 intentionally has no vehicle_devices row: never having reported
  -- a GPS fix is exactly the case computeGpsStatus() maps to UNKNOWN.

  insert into public.gps_events (
    organization_id, vehicle_device_id, vehicle_id, recorded_at,
    latitude, longitude, speed_kph, heading_degrees, ignition_on, odometer_km,
    movement_state, raw_payload
  ) values
  (v_org_id, v_device_101, v_vehicle_101, now() - interval '2 minutes',
   39.739, -104.985, 88.2, 47.5, true, 214512.4, 'moving',
   '{"source":"seed"}'::jsonb),
  (v_org_id, v_device_102, v_vehicle_102, now() - interval '15 minutes',
   39.612, -105.021, 0, 12.0, false, 178301.9, 'stationary',
   '{"source":"seed"}'::jsonb),
  (v_org_id, v_device_103, v_vehicle_103, now() - interval '90 minutes',
   39.55, -104.72, 61.4, 190.2, true, 261912.6, 'moving',
   '{"source":"seed"}'::jsonb);

end $$;
