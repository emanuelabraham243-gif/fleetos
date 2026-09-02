-- The Documents tab needs a document number (e.g. an insurance policy
-- number or registration number) that Phase 1's vehicle_documents didn't
-- have a use for yet. Nullable, additive.
alter table public.vehicle_documents add column document_number text;
