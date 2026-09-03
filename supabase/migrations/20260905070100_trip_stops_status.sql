-- ============================================================================
-- trip_stops didn't carry its own lifecycle status -- Phase 4 needs to
-- distinguish a stop that's merely scheduled from one already reached,
-- in progress, completed, or skipped, independent of the parent trip's
-- own status.
-- ============================================================================
create type public.trip_stop_status as enum ('PLANNED', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED');

alter table public.trip_stops add column status public.trip_stop_status not null default 'PLANNED';

create trigger audit_changes
  after update or delete on public.trip_stops
  for each row execute function public.record_audit_event();
