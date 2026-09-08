do $$
declare
  org_id uuid := '6348514b-e05d-44ef-85d2-5042a2d32046';
  v101 uuid := 'a4e7b051-3c5c-4130-a38b-371777e65fd7';
  v102 uuid := '4e9b3c34-b986-48dd-ba56-ef389c97f302';
  v103 uuid := 'eb92c718-7015-44ae-a8dd-07f40f948ce5';
  v104 uuid := '1b846c7f-8bfd-4def-a58a-cc897364ff8e';
  d_abebe uuid := '01ec1249-2e4a-47d4-a891-b908e1696b25';
  d_dawit uuid := '1ed8dced-2728-4468-9d5c-bd8dcd7a2e04';
  d_getachew uuid := 'faaef90e-89ec-4aa4-ad66-dd3c1ee9e640';
  d_henok uuid := '41d93abf-ddcf-4e17-9e1a-74a89bd533a4';
  p_alex uuid := '04153eae-dc12-4f1e-ac5f-b7ec2157fe9c';
  p_jordan uuid := '8b486992-9563-40c0-8d2d-62043d0bd3a4';
  vd_bole uuid := 'be08dfb5-d983-4ca8-9ba1-535f6002cde6';
  vd_merkato uuid := 'bb422597-6f76-4c70-a63b-a1d032f68ac5';
  vd_kaliti uuid := gen_random_uuid();
  vd_adama uuid := gen_random_uuid();
  sched_101_tire uuid := gen_random_uuid();
  sched_101_safety uuid := gen_random_uuid();
  sched_102_timing uuid := gen_random_uuid();
  sched_103_brake uuid := gen_random_uuid();
  sched_104_oil uuid := gen_random_uuid();
  issue1 uuid := gen_random_uuid();
  issue2 uuid := gen_random_uuid();
  issue3 uuid := gen_random_uuid();
  issue4 uuid := gen_random_uuid();
  issue5 uuid := gen_random_uuid();
  issue6 uuid := gen_random_uuid();
  issue7 uuid := gen_random_uuid();
  wo1 uuid := gen_random_uuid();
  wo2 uuid := gen_random_uuid();
  wo3 uuid := gen_random_uuid();
  wo4 uuid := gen_random_uuid();
  wo5 uuid := gen_random_uuid();
  wo6 uuid := gen_random_uuid();
  insp1 uuid := gen_random_uuid();
  insp2 uuid := gen_random_uuid();
  insp3 uuid := gen_random_uuid();
  insp4 uuid := gen_random_uuid();
begin

-- Vendors: two repair shops (garages), reused parts/tire vendors already exist
insert into vendors (id, organization_id, name, category, contact_name, phone, address) values
  (vd_kaliti, org_id, 'Kaliti Heavy Truck Garage', 'repair_shop', 'Mulugeta Fikre', '+251-11-467-2345', 'Kaliti Industrial Zone, Addis Ababa'),
  (vd_adama, org_id, 'Adama Truck Service Center', 'repair_shop', 'Tewodros Yilma', '+251-22-111-8890', 'Adama, Oromia');

-- Maintenance schedules: covering MILEAGE, TIME, and TIME_AND_MILEAGE rule types
-- with a spread of OVERDUE / DUE_SOON / UPCOMING due statuses.
insert into maintenance_schedules
  (id, organization_id, vehicle_id, title, interval_km, interval_days, last_done_at, last_done_odometer_km, next_due_at, next_due_odometer_km, is_active) values
  (sched_101_tire, org_id, v101, 'Tire rotation & inspection', 20000, null, null, 195000, null, 215000, true),
  (sched_101_safety, org_id, v101, 'Annual safety certification', null, 365, '2025-08-20', null, '2026-08-20', null, true),
  (sched_103_brake, org_id, v103, 'Full brake service', 10000, 60, '2026-06-01', 250000, '2026-07-31', 260000, true),
  (sched_104_oil, org_id, v104, 'Oil and filter change', 15000, null, null, 78000, null, 93000, true),
  (sched_102_timing, org_id, v102, 'Timing belt replacement', 100000, 730, '2025-01-10', 100000, '2027-01-09', 200000, true);

-- Maintenance issues: all 7 statuses, varied severities and sources.
insert into maintenance_issues
  (id, organization_id, vehicle_id, driver_id, reported_by, source, issue_type, severity, status, title, description, odometer_km, reported_at, resolved_at, dismissed_reason) values
  (issue1, org_id, v101, d_abebe, null, 'driver_report', 'tires', 'medium', 'REPORTED',
    'Uneven tire wear on rear axle', 'Rear tires show noticeably more wear on the outer edge than the inner edge.', 213600,
    now() - interval '2 days', null, null),
  (issue2, org_id, v103, d_henok, p_alex, 'inspection', 'brakes', 'critical', 'WORK_ORDER_CREATED',
    'BRAKES: Brake response (failed inspection)', 'Excessive pedal travel and grinding noise on rear axle, most noticeable on downhill sections.', 262500,
    now() - interval '6 days' + interval '30 minutes', null, null),
  (issue3, org_id, v104, d_dawit, null, 'driver_report', 'engine', 'low', 'ACKNOWLEDGED',
    'Slight rattling noise near idle after cold start', 'Rattling sound from the engine bay for the first minute or two after a cold start; goes away once warmed up.', 91500,
    now() - interval '5 days', null, null),
  (issue4, org_id, v102, d_getachew, null, 'driver_report', 'electrical', 'high', 'RESOLVED',
    'Dashboard check-engine light illuminating intermittently', 'Check engine light comes on intermittently, usually after driving over rough road sections, then goes off on its own.', 177600,
    now() - interval '14 days', now() - interval '11 days', null),
  (issue5, org_id, v101, d_abebe, null, 'driver_report', 'cooling', 'low', 'DISMISSED',
    'Coolant reservoir level appeared to fluctuate between checks', 'Coolant level in the overflow reservoir looked lower than expected on one check, normal on the next.', 211800,
    now() - interval '10 days', null, 'Confirmed normal coolant expansion tank fluctuation during routine check; no leak found.'),
  (issue6, org_id, v104, d_dawit, null, 'driver_report', 'suspension', 'medium', 'UNDER_DIAGNOSIS',
    'Vehicle pulls slightly to the right at highway speed', 'Steering wheel needs constant slight correction to keep the truck straight above 80 km/h.', 91900,
    now() - interval '4 days', null, null),
  (issue7, org_id, v102, d_getachew, null, 'driver_report', 'transmission', 'high', 'CLOSED',
    'Delayed engagement when shifting from neutral to drive', 'Noticeable pause of a second or two before the transmission engages when shifting from neutral to drive.', 174900,
    now() - interval '25 days', now() - interval '22 days', null);

-- Work orders across the lifecycle: DRAFT/APPROVED, AWAITING_PARTS, IN_REPAIR,
-- COMPLETED (x2, with parts+labor cost breakdown), CANCELLED.
insert into work_orders
  (id, organization_id, vehicle_id, maintenance_issue_id, maintenance_schedule_id, vendor_id, assigned_to, title, description,
   status, priority, maintenance_type, opened_at, started_at, closed_at, downtime_start_at, downtime_end_at,
   odometer_km, completion_odometer_km, completion_notes, estimated_cost, estimated_completion_at, total_cost, currency) values
  (wo1, org_id, v103, issue2, sched_103_brake, vd_kaliti, p_alex, 'Rear brake service',
   'Rear brake pad replacement and rotor resurfacing following failed safety inspection.',
   'IN_REPAIR', 'CRITICAL', 'CORRECTIVE', now() - interval '5 days', now() - interval '4 days', null, now() - interval '4 days', null,
   262850, null, null, 9000, now() + interval '1 day', null, 'ETB'),
  (wo2, org_id, v102, issue4, null, vd_adama, null, 'Check engine light diagnosis and repair',
   'Diagnose and repair intermittent check engine light.',
   'COMPLETED', 'NORMAL', 'CORRECTIVE', now() - interval '14 days', now() - interval '13 days', now() - interval '11 days',
   now() - interval '13 days', now() - interval '11 days',
   177600, 177800, 'Replaced faulty oxygen sensor connector; check engine light cleared and verified over 200km test drive.', 2500, null, 2600, 'ETB'),
  (wo3, org_id, v102, issue7, null, vd_kaliti, null, 'Transmission fluid service and solenoid repair',
   'Address delayed engagement from neutral to drive.',
   'COMPLETED', 'HIGH', 'CORRECTIVE', now() - interval '25 days', now() - interval '24 days', now() - interval '22 days',
   now() - interval '24 days', now() - interval '22 days',
   174900, 175200, 'Replaced transmission fluid and filter kit; recalibrated shift solenoid. Delay no longer present after test drive.', 6000, null, 6600, 'ETB'),
  (wo4, org_id, v104, null, sched_104_oil, null, p_jordan, 'Oil and filter change',
   'Scheduled preventive oil and filter change.',
   'APPROVED', 'NORMAL', 'PREVENTIVE', now() - interval '1 hour', null, null, null, null,
   92180, null, null, 1800, now() + interval '2 days', null, 'ETB'),
  (wo5, org_id, v101, issue1, null, vd_merkato, null, 'Rear tire replacement',
   'Replace worn rear tires identified from uneven wear report.',
   'AWAITING_PARTS', 'HIGH', 'CORRECTIVE', now() - interval '2 days', null, null, null, null,
   213600, null, null, 7200, now() + interval '3 days', null, 'ETB'),
  (wo6, org_id, v104, issue6, null, null, null, 'Suspension inspection (duplicate - cancelled)',
   'Opened in error; duplicate of an existing suspension diagnosis already in progress under the same issue.',
   'CANCELLED', 'NORMAL', 'CORRECTIVE', now() - interval '3 days', null, now() - interval '2 days', null, null,
   null, null, null, null, null, null, 'ETB');

-- Parts + labor for the in-progress and completed work orders (drives total_cost).
-- maintenance_parts.total_cost is a DB-generated column (quantity * unit_cost) -- never inserted explicitly.
insert into maintenance_parts (organization_id, work_order_id, part_name, part_number, quantity, unit_cost, vendor_id) values
  (org_id, wo1, 'Brake pads - rear axle', 'BP-REAR-2200', 1, 4200, vd_kaliti),
  (org_id, wo1, 'Brake fluid DOT4', 'DOT4-1L', 2, 350, vd_bole),
  (org_id, wo2, 'Oxygen sensor connector', 'O2C-118', 1, 1800, vd_adama),
  (org_id, wo3, 'Transmission fluid (20L)', 'ATF-20L', 1, 3600, vd_kaliti),
  (org_id, wo3, 'Transmission filter kit', 'TFK-77', 1, 1200, vd_kaliti),
  (org_id, wo5, 'Radial truck tire 11R22.5', 'TIRE-11R225', 2, 3200, vd_merkato);

insert into maintenance_labor (organization_id, work_order_id, vendor_id, technician_name, description, hours, rate, total_cost) values
  (org_id, wo1, vd_kaliti, 'Mulugeta Fikre', 'Rear brake pad replacement and rotor resurfacing', 6, 450, 2700),
  (org_id, wo2, vd_adama, 'Tewodros Yilma', 'Diagnosed and replaced O2 sensor wiring connector', 2, 400, 800),
  (org_id, wo3, vd_kaliti, 'Mulugeta Fikre', 'Transmission service and solenoid recalibration', 4, 450, 1800);

-- Inspections: two clean PASSED, two PARTIAL (one with a failed item already
-- converted into issue2 above, one still pending that action).
insert into inspections (id, organization_id, vehicle_id, driver_id, inspector_id, inspection_type, performed_at, odometer_km, overall_result, findings) values
  (insp1, org_id, v101, d_abebe, null, 'pre_trip', now() - interval '3 hours', 213950, 'PASSED', null),
  (insp2, org_id, v104, d_dawit, null, 'post_trip', now() - interval '2 days', 91800, 'PASSED', null),
  (insp3, org_id, v103, d_henok, p_alex, 'safety', now() - interval '6 days', 262500, 'PARTIAL', 'Brake response failed; issue opened and vehicle scheduled for repair.'),
  (insp4, org_id, v101, d_abebe, p_jordan, 'routine', now() - interval '3 days', 213500, 'PARTIAL', 'Tire wear flagged for follow-up.');

insert into inspection_items (organization_id, inspection_id, category, item_name, result, note, severity, created_issue_id, sort_order) values
  -- insp1 (pre_trip, all pass)
  (org_id, insp1, 'ENGINE', 'Oil level', 'PASS', null, null, null, 0),
  (org_id, insp1, 'ENGINE', 'Coolant', 'PASS', null, null, null, 1),
  (org_id, insp1, 'ENGINE', 'Leaks', 'PASS', null, null, null, 2),
  (org_id, insp1, 'TIRES', 'Front left', 'PASS', null, null, null, 3),
  (org_id, insp1, 'TIRES', 'Front right', 'PASS', null, null, null, 4),
  (org_id, insp1, 'TIRES', 'Rear tires', 'PASS', null, null, null, 5),
  (org_id, insp1, 'TIRES', 'Spare', 'PASS', null, null, null, 6),
  (org_id, insp1, 'BRAKES', 'Brake response', 'PASS', null, null, null, 7),
  (org_id, insp1, 'BRAKES', 'Warning indicators', 'PASS', null, null, null, 8),
  (org_id, insp1, 'LIGHTS', 'Headlights', 'PASS', null, null, null, 9),
  (org_id, insp1, 'LIGHTS', 'Brake lights', 'PASS', null, null, null, 10),
  (org_id, insp1, 'LIGHTS', 'Indicators', 'PASS', null, null, null, 11),
  (org_id, insp1, 'BODY', 'Visible damage', 'PASS', null, null, null, 12),
  (org_id, insp1, 'BODY', 'Mirrors', 'PASS', null, null, null, 13),
  (org_id, insp1, 'BODY', 'Windshield', 'PASS', null, null, null, 14),
  (org_id, insp1, 'GPS', 'Device operational', 'PASS', null, null, null, 15),
  -- insp2 (post_trip, all pass)
  (org_id, insp2, 'ENGINE', 'Temperature warning', 'PASS', null, null, null, 0),
  (org_id, insp2, 'ENGINE', 'Leaks', 'PASS', null, null, null, 1),
  (org_id, insp2, 'TIRES', 'Front left', 'PASS', null, null, null, 2),
  (org_id, insp2, 'TIRES', 'Front right', 'PASS', null, null, null, 3),
  (org_id, insp2, 'TIRES', 'Rear tires', 'PASS', null, null, null, 4),
  (org_id, insp2, 'BRAKES', 'Brake response', 'PASS', null, null, null, 5),
  (org_id, insp2, 'LIGHTS', 'Headlights', 'PASS', null, null, null, 6),
  (org_id, insp2, 'LIGHTS', 'Brake lights', 'PASS', null, null, null, 7),
  (org_id, insp2, 'BODY', 'Visible damage', 'PASS', null, null, null, 8),
  -- insp3 (safety, one FAIL already converted to issue2)
  (org_id, insp3, 'BRAKES', 'Brake response', 'FAIL', 'Excessive pedal travel and grinding noise on rear axle, most noticeable on downhill sections.', 'critical', issue2, 0),
  (org_id, insp3, 'BRAKES', 'Warning indicators', 'PASS', null, null, null, 1),
  (org_id, insp3, 'LIGHTS', 'Headlights', 'PASS', null, null, null, 2),
  (org_id, insp3, 'LIGHTS', 'Brake lights', 'PASS', null, null, null, 3),
  (org_id, insp3, 'LIGHTS', 'Indicators', 'PASS', null, null, null, 4),
  (org_id, insp3, 'TIRES', 'Front left', 'PASS', null, null, null, 5),
  (org_id, insp3, 'TIRES', 'Front right', 'PASS', null, null, null, 6),
  (org_id, insp3, 'TIRES', 'Rear tires', 'PASS', null, null, null, 7),
  (org_id, insp3, 'TIRES', 'Spare', 'PASS', null, null, null, 8),
  (org_id, insp3, 'BODY', 'Mirrors', 'PASS', null, null, null, 9),
  (org_id, insp3, 'BODY', 'Windshield', 'PASS', null, null, null, 10),
  -- insp4 (routine, one FAIL not yet converted)
  (org_id, insp4, 'ENGINE', 'Oil level', 'PASS', null, null, null, 0),
  (org_id, insp4, 'ENGINE', 'Coolant', 'PASS', null, null, null, 1),
  (org_id, insp4, 'ENGINE', 'Leaks', 'PASS', null, null, null, 2),
  (org_id, insp4, 'TIRES', 'Front left', 'FAIL', 'Worn tread, approaching legal limit.', 'medium', null, 3),
  (org_id, insp4, 'TIRES', 'Front right', 'PASS', null, null, null, 4),
  (org_id, insp4, 'TIRES', 'Rear tires', 'PASS', null, null, null, 5),
  (org_id, insp4, 'TIRES', 'Spare', 'PASS', null, null, null, 6),
  (org_id, insp4, 'BRAKES', 'Brake response', 'PASS', null, null, null, 7),
  (org_id, insp4, 'BRAKES', 'Warning indicators', 'PASS', null, null, null, 8),
  (org_id, insp4, 'LIGHTS', 'Headlights', 'PASS', null, null, null, 9),
  (org_id, insp4, 'LIGHTS', 'Brake lights', 'PASS', null, null, null, 10),
  (org_id, insp4, 'LIGHTS', 'Indicators', 'PASS', null, null, null, 11),
  (org_id, insp4, 'BODY', 'Visible damage', 'PASS', null, null, null, 12),
  (org_id, insp4, 'BODY', 'Mirrors', 'PASS', null, null, null, 13),
  (org_id, insp4, 'BODY', 'Windshield', 'PASS', null, null, null, 14),
  (org_id, insp4, 'GPS', 'Device operational', 'PASS', null, null, null, 15);

end $$;
