-- Same pre-existing gap fixed for revenues/invoices/payments in Phase 8:
-- incidents/disputes' `audit_changes` trigger was only bound to UPDATE OR
-- DELETE since Phase 1, so *creating* an incident or dispute never
-- produced an audit_logs row. Brought up to the same INSERT OR UPDATE OR
-- DELETE coverage before this phase's Report Incident / dispute-creation
-- flows start writing to these tables.

drop trigger if exists audit_changes on incidents;
create trigger audit_changes
  after insert or update or delete on incidents
  for each row execute function record_audit_event();

drop trigger if exists audit_changes on disputes;
create trigger audit_changes
  after insert or update or delete on disputes
  for each row execute function record_audit_event();
