-- ============================================================================
-- Phase 4 demo data: clients, a multi-stop trip, cargo/client details on the
-- existing Phase 2/3 trips, and deliveries spanning every real-world
-- outcome (in transit, delivered in full, partially delivered, refused,
-- damaged, cancelled, arrived-awaiting-confirmation). Applied directly
-- against the Supabase project for this environment; on a fresh project,
-- run after seed.sql, seed_phase2.sql, and seed_phase3_ethiopia.sql.
--
-- IDs below are literal (not looked up) because this file documents exactly
-- what was run against this environment's existing Phase 2/3 seed rows --
-- on a fresh project, replace them with the actual generated ids for your
-- organization/trips/vehicles/drivers first.
-- ============================================================================

insert into public.clients (organization_id, name, contact_name, phone, email, billing_address, notes)
values
  ('6348514b-e05d-44ef-85d2-5042a2d32046', 'Ethio Cement Trading PLC', 'Selamawit Tesfaye', '+251-911-223344', 'selam.tesfaye@ethiocementtrading.example', 'Kirkos Sub-city, Addis Ababa', 'Regular cement bag shipments to regional depots.'),
  ('6348514b-e05d-44ef-85d2-5042a2d32046', 'Bruh Beverages Distribution', 'Dawit Mengistu', '+251-911-556677', 'dawit.m@bruhbeverages.example', 'Bole Sub-city, Addis Ababa', 'Beverage crate distribution to branch stores.'),
  ('6348514b-e05d-44ef-85d2-5042a2d32046', 'Nile Agro Processing S.C.', 'Hirut Alemu', '+251-911-889900', 'hirut.alemu@nileagro.example', 'Akaki Kality Sub-city, Addis Ababa', 'Processed grain and flour bag shipments.');

-- Attach client/cargo details to the existing Phase 2/3 trips (TR-001..TR-005).
update public.trips set
  client_id = (select id from public.clients where name = 'Bruh Beverages Distribution'),
  cargo_description = 'Bottled beverages (assorted crates)',
  cargo_quantity = 200, cargo_quantity_unit = 'crates', cargo_weight_kg = 4200,
  reference_number = 'PO-BB-1042',
  customer_notes = 'Deliver to Hawassa branch store loading dock, weekday hours only.'
where trip_number = 'TR-001';

update public.trips set
  client_id = (select id from public.clients where name = 'Nile Agro Processing S.C.'),
  cargo_description = 'Processed flour, 50kg bags',
  cargo_quantity = 50, cargo_quantity_unit = 'bags', cargo_weight_kg = 2500,
  reference_number = 'PO-NA-0871',
  customer_notes = 'Two consignments on this trip: flour to Adama Warehouse, cement to Adama Depot.'
where trip_number = 'TR-002';

update public.trips set
  client_id = (select id from public.clients where name = 'Ethio Cement Trading PLC'),
  cargo_description = 'Cement, 50kg bags',
  cargo_quantity = 300, cargo_quantity_unit = 'bags', cargo_weight_kg = 15000,
  reference_number = 'PO-EC-2201',
  customer_notes = 'Fuel stop at Awash en route.'
where trip_number = 'TR-003';

update public.trips set
  client_id = (select id from public.clients where name = 'Bruh Beverages Distribution'),
  cargo_description = 'Bottled beverages (assorted crates)',
  cargo_quantity = 120, cargo_quantity_unit = 'crates', cargo_weight_kg = 2520,
  reference_number = 'PO-BB-1077',
  customer_notes = 'Bishoftu retail center, morning delivery window requested.'
where trip_number = 'TR-004';

update public.trips set
  reference_number = 'PO-INT-0099',
  customer_notes = 'Internal reposition run, cancelled before dispatch.'
where trip_number = 'TR-005';

-- Multi-stop example (TR-001: fuel stop then final drop-off) and a
-- completed multi-stop trip (TR-003: fuel stop then final drop-off).
insert into public.trip_stops (organization_id, trip_id, sequence, location, stop_type, status, scheduled_at, arrived_at, departed_at, notes)
select '6348514b-e05d-44ef-85d2-5042a2d32046', id, 1, 'Mojo', 'fuel', 'COMPLETED', '2026-09-02 15:45:00+00', '2026-09-02 15:52:00+00', '2026-09-02 16:08:00+00', 'Fuel top-up, no cargo activity.'
from public.trips where trip_number = 'TR-001'
union all
select '6348514b-e05d-44ef-85d2-5042a2d32046', id, 2, 'Hawassa', 'dropoff', 'PLANNED', '2026-09-02 20:00:00+00', null, null, 'Final delivery stop -- Bruh Beverages branch store.'
from public.trips where trip_number = 'TR-001'
union all
select '6348514b-e05d-44ef-85d2-5042a2d32046', id, 1, 'Awash', 'fuel', 'COMPLETED', '2026-08-23 23:15:00+00', '2026-08-23 23:28:00+00', '2026-08-23 23:47:00+00', 'Fuel and driver rest stop.'
from public.trips where trip_number = 'TR-003'
union all
select '6348514b-e05d-44ef-85d2-5042a2d32046', id, 2, 'Dire Dawa', 'dropoff', 'COMPLETED', '2026-08-24 03:30:00+00', '2026-08-24 04:02:44+00', '2026-08-24 04:45:00+00', 'Final delivery stop -- Ethio Cement Trading depot.'
from public.trips where trip_number = 'TR-003';

-- Deliveries spanning every real-world outcome.
insert into public.deliveries (
  organization_id, trip_id, trip_stop_id, client_id, delivery_number, reference_number,
  recipient_name, description, status, scheduled_at, arrived_at, delivered_at, confirmed_by,
  expected_quantity, delivered_quantity, quantity_unit, refusal_reason, notes
)
select
  '6348514b-e05d-44ef-85d2-5042a2d32046', t.id, ts.id, c.id, 'DL-001', 'PO-BB-1042',
  'Hawassa Branch Store', 'Bottled beverages (assorted crates)', 'IN_TRANSIT', '2026-09-02 20:00:00+00', null, null, null,
  200, null, 'crates', null, null
from public.trips t
join public.trip_stops ts on ts.trip_id = t.id and ts.location = 'Hawassa'
join public.clients c on c.name = 'Bruh Beverages Distribution'
where t.trip_number = 'TR-001'

union all

select
  '6348514b-e05d-44ef-85d2-5042a2d32046', t.id, null, c.id, 'DL-002', 'PO-NA-0871',
  'Adama Warehouse', 'Processed flour, 50kg bags', 'DELIVERED', '2026-08-29 21:30:00+00', '2026-08-29 21:48:00+00', '2026-08-29 22:02:44+00',
  (select id from public.profiles where full_name = 'Jordan Blake'),
  50, 50, 'bags', null, null
from public.trips t
join public.clients c on c.name = 'Nile Agro Processing S.C.'
where t.trip_number = 'TR-002'

union all

select
  '6348514b-e05d-44ef-85d2-5042a2d32046', t.id, null, c.id, 'DL-006', 'PO-EC-1980',
  'Adama Depot', 'Cement, 50kg bags', 'DAMAGED', '2026-08-29 21:30:00+00', '2026-08-29 21:50:00+00', '2026-08-29 22:10:00+00',
  (select id from public.profiles where full_name = 'Jordan Blake'),
  100, 0, 'bags', null,
  '[Damage reported 2026-08-29T22:10:00.000Z] Roughly a third of the bags arrived torn, contents spilled in the truck bed -- observed and photographed at unloading.'
from public.trips t
join public.clients c on c.name = 'Ethio Cement Trading PLC'
where t.trip_number = 'TR-002'

union all

select
  '6348514b-e05d-44ef-85d2-5042a2d32046', t.id, ts.id, c.id, 'DL-003', 'PO-EC-2201',
  'Dire Dawa Depot', 'Cement, 50kg bags', 'PARTIALLY_DELIVERED', '2026-08-24 03:30:00+00', '2026-08-24 04:02:44+00', '2026-08-24 04:40:00+00',
  (select id from public.profiles where full_name = 'Jordan Blake'),
  300, 280, 'bags', null,
  'Recipient count came in 20 bags short of the manifest at unloading -- discrepancy noted for the client to review.'
from public.trips t
join public.trip_stops ts on ts.trip_id = t.id and ts.location = 'Dire Dawa'
join public.clients c on c.name = 'Ethio Cement Trading PLC'
where t.trip_number = 'TR-003'

union all

select
  '6348514b-e05d-44ef-85d2-5042a2d32046', t.id, null, c.id, 'DL-004', 'PO-BB-1077',
  'Bishoftu Retail Center', 'Bottled beverages (assorted crates)', 'REFUSED', '2026-08-31 20:30:00+00', '2026-08-31 20:55:00+00', '2026-08-31 21:02:44+00',
  (select id from public.profiles where full_name = 'Jordan Blake'),
  120, null, 'crates',
  'Recipient stated the order was intended for next week''s promotion and declined to accept early delivery.', null
from public.trips t
join public.clients c on c.name = 'Bruh Beverages Distribution'
where t.trip_number = 'TR-004'

union all

select
  '6348514b-e05d-44ef-85d2-5042a2d32046', t.id, null, null, 'DL-005', 'PO-INT-0099',
  null, null, 'CANCELLED', '2026-08-27 20:00:00+00', null, null, null,
  null, null, null, null,
  '[Cancelled 2026-08-27T19:30:00.000Z] Trip cancelled before dispatch -- delivery cancelled with it.'
from public.trips t
where t.trip_number = 'TR-005';

-- A 6th trip demonstrating ARRIVED (a delivery ready for the confirmation
-- dialog, not yet delivered/partial/refused/damaged).
insert into public.trips (
  organization_id, trip_number, vehicle_id, driver_id, client_id, status,
  origin, destination, scheduled_start, actual_start, actual_end,
  cargo_description, cargo_quantity, cargo_quantity_unit, cargo_weight_kg,
  reference_number, customer_notes
)
select
  '6348514b-e05d-44ef-85d2-5042a2d32046', 'TR-006',
  (select id from public.vehicles where unit_number = '104'),
  (select id from public.drivers where full_name = 'Dawit Tesfaye'),
  (select id from public.clients where name = 'Nile Agro Processing S.C.'),
  'ARRIVED', 'Addis Ababa', 'Mojo', '2026-09-03 05:00:00+00', '2026-09-03 05:12:00+00', null,
  'Processed flour, 50kg bags', 80, 'bags', 4000,
  'PO-NA-0902', 'Mojo grain depot, awaiting unloading confirmation.'
where not exists (select 1 from public.trips where trip_number = 'TR-006');

insert into public.deliveries (
  organization_id, trip_id, client_id, delivery_number, reference_number,
  recipient_name, description, status, scheduled_at, arrived_at,
  expected_quantity, quantity_unit
)
select
  '6348514b-e05d-44ef-85d2-5042a2d32046', t.id, c.id, 'DL-007', 'PO-NA-0902',
  'Mojo Grain Depot', 'Processed flour, 50kg bags', 'ARRIVED', '2026-09-03 09:00:00+00', '2026-09-03 09:10:00+00',
  80, 'bags'
from public.trips t
join public.clients c on c.name = 'Nile Agro Processing S.C.'
where t.trip_number = 'TR-006'
  and not exists (select 1 from public.deliveries where delivery_number = 'DL-007');
