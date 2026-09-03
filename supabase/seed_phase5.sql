-- ============================================================================
-- Phase 5 demo data: employee IDs and license issue dates for the existing
-- 5 drivers, one driver moved to ON_LEAVE (a scheduling fact, not a
-- disciplinary one), driver documents spanning every expiry status, and
-- one dispute connecting a driver to the trip/delivery/vehicle/client it
-- involves, with a driver response attached. Applied directly against the
-- Supabase project for this environment; on a fresh project, run after
-- seed.sql, seed_phase2.sql, seed_phase3_ethiopia.sql, and seed_phase4.sql.
-- ============================================================================

update drivers set employee_id = 'EMP-001', license_issued_at = '2016-03-12' where full_name = 'Abebe Kebede';
update drivers set employee_id = 'EMP-002', license_issued_at = '2015-11-08' where full_name = 'Dawit Tesfaye';
update drivers set employee_id = 'EMP-003', license_issued_at = '2018-06-20' where full_name = 'Getachew Alemu';
update drivers set employee_id = 'EMP-004', license_issued_at = '2013-01-15', status = 'ON_LEAVE' where full_name = 'Henok Girma';
update drivers set employee_id = 'EMP-005', license_issued_at = '2019-09-02' where full_name = 'Samuel Bekele';

-- License documents spanning VALID / EXPIRING_SOON / EXPIRED, plus one
-- medical card and one training certificate for document-type variety.
insert into driver_documents (organization_id, driver_id, document_type, document_number, issued_at, expires_at, notes)
select organization_id, id, 'license'::document_type_driver, license_number, license_issued_at, '2027-03-12'::date, null
from drivers where full_name = 'Abebe Kebede'
union all
select organization_id, id, 'license'::document_type_driver, license_number, license_issued_at, '2026-09-20'::date, null
from drivers where full_name = 'Dawit Tesfaye'
union all
select organization_id, id, 'license'::document_type_driver, license_number, license_issued_at, '2026-07-01'::date, null
from drivers where full_name = 'Getachew Alemu'
union all
select organization_id, id, 'license'::document_type_driver, license_number, license_issued_at, '2025-01-15'::date, null
from drivers where full_name = 'Henok Girma'
union all
select organization_id, id, 'license'::document_type_driver, license_number, license_issued_at, '2029-09-02'::date, null
from drivers where full_name = 'Samuel Bekele'
union all
select organization_id, id, 'medical_card'::document_type_driver, 'MED-' || substr(id::text, 1, 8), '2025-01-10'::date, '2027-01-10'::date, 'Annual fitness certificate'
from drivers where full_name = 'Abebe Kebede'
union all
select organization_id, id, 'medical_card'::document_type_driver, 'MED-' || substr(id::text, 1, 8), '2024-09-01'::date, '2026-09-15'::date, 'Annual fitness certificate -- renewal due soon'
from drivers where full_name = 'Getachew Alemu'
union all
select organization_id, id, 'training_certificate'::document_type_driver, 'TRN-' || substr(id::text, 1, 8), '2024-05-01'::date, '2027-05-01'::date, 'Defensive driving course'
from drivers where full_name = 'Dawit Tesfaye';

-- A dispute connecting the refused TR-004 / DL-004 delivery to the driver
-- who ran it, with the driver's own account preserved in driver_response
-- alongside the client's side of the story in description.
insert into disputes (organization_id, dispute_type, description, status, trip_id, delivery_id, vehicle_id, driver_id, client_id, driver_response, opened_at)
select
  t.organization_id,
  'delivery_dispute'::dispute_type,
  'Client reports the delivery for TR-004 (Bishoftu Retail Center) should have been accepted -- they dispute the recipient''s stated reason for refusal and are requesting a redelivery at no extra charge.',
  'under_review'::dispute_status,
  t.id,
  de.id,
  t.vehicle_id,
  t.driver_id,
  de.client_id,
  '[2026-08-31T21:30:00.000Z] I arrived at the Bishoftu Retail Center at the scheduled time. The person at the gate told me directly that the order was for next week and refused to let me unload. I have a photo of the closed gate with a timestamp.',
  '2026-09-01 08:00:00+00'
from trips t
join deliveries de on de.trip_id = t.id
where t.trip_number = 'TR-004' and de.delivery_number = 'DL-004';
