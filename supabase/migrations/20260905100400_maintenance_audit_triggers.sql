-- ============================================================================
-- None of these 7 tables carried the audit trigger before Phase 7 -- they
-- had no real write path (no UI ever wrote to them). Every status change,
-- cost entry, and schedule edit this phase's UI makes is now provably in
-- audit_logs, the same guarantee every other actively-used table has.
-- ============================================================================
create trigger audit_changes
  after insert or update or delete on public.maintenance_issues
  for each row execute function record_audit_event();

create trigger audit_changes
  after insert or update or delete on public.maintenance_parts
  for each row execute function record_audit_event();

create trigger audit_changes
  after insert or update or delete on public.maintenance_schedules
  for each row execute function record_audit_event();

create trigger audit_changes
  after insert or update or delete on public.inspections
  for each row execute function record_audit_event();

create trigger audit_changes
  after insert or update or delete on public.work_orders
  for each row execute function record_audit_event();

create trigger audit_changes
  after insert or update or delete on public.maintenance_labor
  for each row execute function record_audit_event();

create trigger audit_changes
  after insert or update or delete on public.inspection_items
  for each row execute function record_audit_event();
