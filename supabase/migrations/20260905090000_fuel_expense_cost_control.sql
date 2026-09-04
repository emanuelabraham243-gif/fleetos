-- ============================================================================
-- Fuel transactions and expenses can now be linked to a trip directly.
-- Neither table had a trip_id before -- Phase 4's trip financial summary
-- had to correlate them by time window instead, which this migration makes
-- unnecessary going forward. Left nullable/unset: "Trip: Unassigned" is a
-- real, honest state, never guessed at.
-- ============================================================================
alter table public.fuel_transactions add column trip_id uuid references public.trips (id) on delete set null;
alter table public.expenses add column trip_id uuid references public.trips (id) on delete set null;

create index fuel_transactions_trip_id_idx on public.fuel_transactions (trip_id);
create index expenses_trip_id_idx on public.expenses (trip_id);

-- ============================================================================
-- Both tables already carry a free-text vendor_name (for the "we don't
-- actually know the vendor" case the spec explicitly wants preserved).
-- vendor_id is additive: when the vendor *is* one of the org's known
-- vendors, link it instead of duplicating its name as text.
-- ============================================================================
alter table public.fuel_transactions add column vendor_id uuid references public.vendors (id) on delete set null;
alter table public.expenses add column vendor_id uuid references public.vendors (id) on delete set null;

create index fuel_transactions_vendor_id_idx on public.fuel_transactions (vendor_id);
create index expenses_vendor_id_idx on public.expenses (vendor_id);

-- ============================================================================
-- Odometer override: a fuel transaction's odometer is normally expected to
-- be >= the vehicle's previous known reading. When an authorized user
-- overrides that check, the reason is recorded on the row itself (in
-- addition to the standard audit trigger already on this table capturing
-- who/when/before/after).
-- ============================================================================
alter table public.fuel_transactions add column odometer_override_reason text;

-- ============================================================================
-- payment_method gains mobile_money -- the existing enum (cash, card,
-- bank_transfer, check, other) already covers everything else the spec
-- asks for. Expenses record how they were paid; this is not a connection
-- to the payments table, which is accounts-receivable (client -> org) and
-- would misrepresent an accounts-payable fact if reused for that purpose.
-- ============================================================================
alter type public.payment_method add value 'mobile_money';

alter table public.expenses add column payment_method public.payment_method;
alter table public.expenses add column reference_number text;

-- ============================================================================
-- expense_category gains the categories the spec asks for that the
-- existing set doesn't already cover. "toll" already covers Road/Toll,
-- "driver_related" already covers Driver, "office" already covers
-- Administrative -- kept as-is rather than adding near-duplicate values.
-- ============================================================================
alter type public.expense_category add value 'loading_unloading';
alter type public.expense_category add value 'accommodation';
alter type public.expense_category add value 'meals';
alter type public.expense_category add value 'repairs';
alter type public.expense_category add value 'communication';

-- ============================================================================
-- vendor_category gains tire_supplier -- the spec lists it explicitly
-- alongside repair_shop/parts_supplier/fuel_station/insurance, which
-- already exist.
-- ============================================================================
alter type public.vendor_category add value 'tire_supplier';
