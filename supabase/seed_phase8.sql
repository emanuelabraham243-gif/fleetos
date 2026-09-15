-- Phase 8: Revenue + Invoicing & Payments demo data.
-- Assumes Phase 1-7 seed data (clients, trips TR-001..TR-006) is already applied.

do $$
declare
  org_id uuid := '6348514b-e05d-44ef-85d2-5042a2d32046';
  c_bruh uuid := 'a18b09ac-7169-4ef0-adeb-c816a85223d4';
  c_ethio uuid := '5f2a848b-1ddb-4f8c-a53b-68320a37f6a6';
  c_nile uuid := 'f47147c5-548d-41e6-9ac4-b6342e515d19';
  t_001 uuid := '05fe85c4-2e80-4ceb-8469-6627a06e2646';
  t_002 uuid := '313092f1-5137-4d2a-abb1-8f46f2bc2f45';
  t_003 uuid := '4ba83c43-a5ef-47c4-9bf8-a6f938ed9b76';
  t_004 uuid := 'a48520b3-6031-4868-98c5-3b1b1bd567a2';
  t_006 uuid := 'c26bda37-789b-48b6-8d94-d1eef90d5cdd';
  p_alex uuid := '04153eae-dc12-4f1e-ac5f-b7ec2157fe9c';
  p_jordan uuid := '8b486992-9563-40c0-8d2d-62043d0bd3a4';
  contract_bruh uuid := gen_random_uuid();
  contract_nile uuid := gen_random_uuid();
  inv_001 uuid := gen_random_uuid();
  inv_002 uuid := gen_random_uuid();
  inv_003 uuid := gen_random_uuid();
  inv_004 uuid := gen_random_uuid();
  inv_005 uuid := gen_random_uuid();
begin

-- Contracts: one per-trip rate agreement, one flat seasonal contract.
insert into contracts (id, organization_id, client_id, contract_number, title, rate_type, rate_amount, status, start_date, end_date) values
  (contract_bruh, org_id, c_bruh, 'CNT-001', 'Monthly Beverage Distribution Agreement', 'per_trip', 42000, 'active', '2026-01-01', '2026-12-31'),
  (contract_nile, org_id, c_nile, 'CNT-002', 'Seasonal Agro Haul Contract', 'flat', 250000, 'active', '2026-06-01', '2027-05-31');

-- Revenue: one row per completed/arrived trip that actually earned money.
-- TR-005 was cancelled and correctly has no revenue row.
insert into revenues (organization_id, client_id, contract_id, trip_id, occurred_at, amount, currency, description, created_by) values
  (org_id, c_bruh, contract_bruh, t_001, '2026-09-03', 135000, 'ETB', 'Full truckload delivery -- Addis Ababa to Hawassa, TR-001.', p_alex),
  (org_id, c_nile, null, t_002, '2026-08-30', 45000, 'ETB', 'Agro goods haul, TR-002.', p_alex),
  (org_id, c_ethio, null, t_003, '2026-08-24', 52000, 'ETB', 'Cement haul, TR-003.', p_jordan),
  (org_id, c_bruh, contract_bruh, t_004, '2026-09-01', 38500, 'ETB', 'Beverage distribution run, TR-004.', p_alex),
  (org_id, c_nile, null, t_006, '2026-09-04', 18000, 'ETB', 'Regional agro delivery, TR-006.', p_jordan);

-- Invoices: covers all 5 display states -- DRAFT, SENT (current), SENT+OVERDUE, PAID, VOID.
insert into invoices (id, organization_id, client_id, invoice_number, status, issue_date, due_date, subtotal_amount, tax_amount, total_amount, currency, notes) values
  (inv_001, org_id, c_bruh, 'INV-001', 'sent', '2026-09-05', '2026-10-05', 170000, 25500, 195500, 'ETB', 'Covers TR-001 and TR-004 under CNT-001.'),
  (inv_002, org_id, c_nile, 'INV-002', 'sent', '2026-08-01', '2026-08-31', 45000, 6750, 51750, 'ETB', 'Covers TR-002.'),
  (inv_003, org_id, c_ethio, 'INV-003', 'sent', '2026-08-25', '2026-09-24', 52000, 7800, 59800, 'ETB', 'Covers TR-003.'),
  (inv_004, org_id, c_nile, 'INV-004', 'draft', '2026-09-14', '2026-10-14', 18000, 2700, 20700, 'ETB', 'Covers TR-006 -- not yet sent.'),
  (inv_005, org_id, c_bruh, 'INV-005', 'void', '2026-09-10', '2026-10-10', 5000, 750, 5750, 'ETB',
    E'[Voided 2026-09-11T09:00:00.000Z] Created against the wrong client -- duplicate of INV-001''s line items.');

-- Payments: a partial payment (INV-001, still SENT with a balance), a full payment (INV-003, now PAID). INV-002 stays unpaid and overdue on purpose.
insert into payments (organization_id, invoice_id, client_id, amount, currency, method, paid_at, reference, created_by) values
  (org_id, inv_001, c_bruh, 100000, 'ETB', 'bank_transfer', '2026-09-10', 'TT-88231', p_alex),
  (org_id, inv_003, c_ethio, 59800, 'ETB', 'mobile_money', '2026-09-05', 'TELEBIRR-990211', p_jordan);

end $$;
