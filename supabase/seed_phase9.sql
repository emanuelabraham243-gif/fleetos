-- Phase 9: Compliance, Issues, Intelligence & System demo data.
-- Assumes Phase 1-8 seed data (clients, drivers, vehicles, trips TR-001..TR-006,
-- the Phase 8 contracts CNT-001/CNT-002) is already applied.

do $$
declare
  org_id uuid := '6348514b-e05d-44ef-85d2-5042a2d32046';
  v101 uuid := 'a4e7b051-3c5c-4130-a38b-371777e65fd7';
  v104 uuid := '1b846c7f-8bfd-4def-a58a-cc897364ff8e';
  c_bruh uuid := 'a18b09ac-7169-4ef0-adeb-c816a85223d4';
  c_ethio uuid := '5f2a848b-1ddb-4f8c-a53b-68320a37f6a6';
  c_nile uuid := 'f47147c5-548d-41e6-9ac4-b6342e515d19';
  t_002 uuid := '313092f1-5137-4d2a-abb1-8f46f2bc2f45';
  d_abebe uuid := '01ec1249-2e4a-47d4-a891-b908e1696b25';
  d_dawit uuid := '1ed8dced-2728-4468-9d5c-bd8dcd7a2e04';
  d_getachew uuid := 'faaef90e-89ec-4aa4-ad66-dd3c1ee9e640';
  p_alex uuid := '04153eae-dc12-4f1e-ac5f-b7ec2157fe9c';
  p_jordan uuid := '8b486992-9563-40c0-8d2d-62043d0bd3a4';
  provider_webhook uuid := 'dfa140c6-c3be-4fe3-9d59-0c956688be27';
  inc2 uuid := gen_random_uuid();
  inc3 uuid := gen_random_uuid();
begin

-- GPS connection in an error state, to exercise System Health's unhealthy-connection signal.
insert into gps_connections (organization_id, gps_provider_id, name, status, config, last_synced_at) values
  (org_id, provider_webhook, 'Addis Fleet Tracker (Backup)', 'error', '{}'::jsonb, now() - interval '5 days');

-- Contracts: add expired/terminated/draft so all 4 statuses are represented
-- alongside the 2 active contracts Phase 8 already seeded.
insert into contracts (organization_id, client_id, contract_number, title, rate_type, rate_amount, status, start_date, end_date, notes) values
  (org_id, c_ethio, 'CNT-003', 'Q1 Cement Haul Agreement', 'per_mile', 85, 'expired', '2026-01-01', '2026-06-30', null),
  (org_id, c_bruh, 'CNT-004', 'Pilot Distribution Trial', 'flat', 15000, 'terminated', '2025-11-01', '2026-02-01', 'Terminated early -- superseded by CNT-001.'),
  (org_id, c_ethio, 'CNT-005', 'Proposed Weekly Cement Runs', 'per_trip', 48000, 'draft', null, null, null);

-- Incidents: an open safety event and a critical cargo-damage event under investigation.
insert into incidents (id, organization_id, vehicle_id, driver_id, incident_type, severity, status, occurred_at, location, description, created_by) values
  (inc2, org_id, v101, d_abebe, 'safety', 'high', 'open', now() - interval '3 days', 'Adama-Awash highway, km 40',
    'Driver reported a hard-braking event after a tire pressure warning light; pulled over safely, no collision.', p_alex),
  (inc3, org_id, v104, d_dawit, 'cargo_damage', 'critical', 'investigating', now() - interval '6 days', 'Merkato loading dock, Addis Ababa',
    'Several pallets of beverage cargo found damaged on arrival; packaging showed signs of shifting during transit.', p_jordan);

-- Evidence spanning the fact/user_input/interpretation spectrum the spec asks for.
insert into incident_evidence (organization_id, incident_id, kind, source, content, recorded_at, created_by) values
  (org_id, inc2, 'user_input', 'statement', 'Driver stated the TPMS warning light illuminated suddenly around 14:20, followed by a strong vibration from the front right wheel.', now() - interval '3 days', p_alex),
  (org_id, inc2, 'fact', 'gps', 'GPS log shows the vehicle decelerated from 78 km/h to a stop over approximately 40 seconds at the reported location and time.', now() - interval '3 days' + interval '5 minutes', p_alex),
  (org_id, inc3, 'fact', 'photo', 'Photos taken at delivery show 4 crushed cartons on the pallet''s leading edge.', now() - interval '6 days', p_jordan),
  (org_id, inc3, 'interpretation', 'statement', 'Warehouse staff believe the load was not adequately secured before departure, based on the direction of the damage.', now() - interval '6 days' + interval '30 minutes', p_jordan);

-- Disputes: one linked to the new cargo-damage incident (open), one resolved on its own.
insert into disputes (organization_id, incident_id, client_id, vehicle_id, driver_id, dispute_type, status, description, opened_at, created_by) values
  (org_id, inc3, c_bruh, v104, d_dawit, 'damage_claim', 'open',
    'Client is claiming compensation for damaged beverage cargo discovered at delivery; formal claim submitted with photos.', now() - interval '5 days', p_jordan);

insert into disputes (organization_id, trip_id, client_id, driver_id, dispute_type, status, description, driver_response, resolution, opened_at, resolved_at, created_by) values
  (org_id, t_002, c_nile, d_getachew, 'fuel_variance', 'resolved',
    'Client questioned the fuel surcharge applied to invoice INV-002, citing a lower distance than expected.',
    E'[2026-08-27T10:00:00.000Z] Confirmed the route included an unplanned detour due to a road closure near Mojo, adding approximately 35km.',
    'Reviewed the GPS trip log confirming the detour; fuel surcharge upheld as accurate. Client notified with route evidence attached.',
    now() - interval '20 days', now() - interval '15 days', p_alex);

end $$;
