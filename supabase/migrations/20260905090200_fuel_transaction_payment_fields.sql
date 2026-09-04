-- ============================================================================
-- The Record Fuel form (Phase 6 spec) lists payment-method and
-- reference-number as optional fields, matching what expenses already
-- got in 20260905090000. fuel_transactions was missed in that migration --
-- added here rather than duplicated elsewhere. Fuel type is deliberately
-- NOT duplicated onto this table: vehicles.fuel_type already exists and a
-- fuel transaction is a purchase for that vehicle's own fuel type, so a
-- second column would just restate data already on record.
-- ============================================================================
alter table public.fuel_transactions add column payment_method public.payment_method;
alter table public.fuel_transactions add column reference_number text;
