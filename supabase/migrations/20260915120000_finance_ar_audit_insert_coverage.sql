-- revenues/invoices/payments' `audit_changes` trigger was only bound to
-- UPDATE OR DELETE since Phase 1 -- a creation (Record Revenue, Create
-- Invoice, Record Payment) never produced an audit_logs row, unlike the
-- maintenance/inspection tables (Phase 7), which are bound to INSERT OR
-- UPDATE OR DELETE. Discovered while seeding this phase's demo data and
-- fixed here for the three tables this phase's Revenue/Payments sections
-- actually write to, matching the Phase 7 precedent.

drop trigger if exists audit_changes on revenues;
create trigger audit_changes
  after insert or update or delete on revenues
  for each row execute function record_audit_event();

drop trigger if exists audit_changes on invoices;
create trigger audit_changes
  after insert or update or delete on invoices
  for each row execute function record_audit_event();

drop trigger if exists audit_changes on payments;
create trigger audit_changes
  after insert or update or delete on payments
  for each row execute function record_audit_event();
