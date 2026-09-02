-- ============================================================================
-- Add indexes for foreign keys flagged by the performance advisor as
-- unindexed (mostly organization_id on tables where it wasn't the lead
-- column of another index, and optional lookup FKs like created_by/driver_id).
-- ============================================================================
create index alerts_acknowledged_by_idx on public.alerts (acknowledged_by);
create index alerts_driver_id_idx on public.alerts (driver_id);
create index attachments_uploaded_by_idx on public.attachments (uploaded_by);
create index audit_logs_actor_id_idx on public.audit_logs (actor_id);
create index contract_documents_organization_id_idx on public.contract_documents (organization_id);
create index deliveries_client_id_idx on public.deliveries (client_id);
create index deliveries_trip_stop_id_idx on public.deliveries (trip_stop_id);
create index disputes_client_id_idx on public.disputes (client_id);
create index disputes_created_by_idx on public.disputes (created_by);
create index disputes_driver_id_idx on public.disputes (driver_id);
create index disputes_incident_id_idx on public.disputes (incident_id);
create index expenses_created_by_idx on public.expenses (created_by);
create index expenses_driver_id_idx on public.expenses (driver_id);
create index expenses_vehicle_id_idx on public.expenses (vehicle_id);
create index fuel_transactions_created_by_idx on public.fuel_transactions (created_by);
create index fuel_transactions_driver_id_idx on public.fuel_transactions (driver_id);
create index gps_connections_gps_provider_id_idx on public.gps_connections (gps_provider_id);
create index gps_events_vehicle_device_id_idx on public.gps_events (vehicle_device_id);
create index incident_evidence_created_by_idx on public.incident_evidence (created_by);
create index incident_evidence_organization_id_idx on public.incident_evidence (organization_id);
create index incidents_created_by_idx on public.incidents (created_by);
create index incidents_driver_id_idx on public.incidents (driver_id);
create index incidents_trip_id_idx on public.incidents (trip_id);
create index inspections_driver_id_idx on public.inspections (driver_id);
create index maintenance_issues_reported_by_idx on public.maintenance_issues (reported_by);
create index maintenance_parts_organization_id_idx on public.maintenance_parts (organization_id);
create index maintenance_schedules_organization_id_idx on public.maintenance_schedules (organization_id);
create index notifications_organization_id_idx on public.notifications (organization_id);
create index payments_client_id_idx on public.payments (client_id);
create index payments_created_by_idx on public.payments (created_by);
create index revenues_client_id_idx on public.revenues (client_id);
create index revenues_contract_id_idx on public.revenues (contract_id);
create index revenues_created_by_idx on public.revenues (created_by);
create index revenues_trip_id_idx on public.revenues (trip_id);
create index trip_stops_organization_id_idx on public.trip_stops (organization_id);
create index trips_contract_id_idx on public.trips (contract_id);
create index vehicle_locations_gps_event_id_idx on public.vehicle_locations (gps_event_id);
create index vehicle_locations_organization_id_idx on public.vehicle_locations (organization_id);
create index work_orders_maintenance_issue_id_idx on public.work_orders (maintenance_issue_id);
create index work_orders_vendor_id_idx on public.work_orders (vendor_id);

-- ============================================================================
-- RLS policy tuning: wrap auth.uid() as (select auth.uid()) so Postgres
-- evaluates it once per statement instead of once per row, and collapse the
-- two profiles UPDATE policies (own-row vs. admin-in-org) into one so only
-- a single permissive policy is evaluated per row instead of two.
-- ============================================================================
drop policy "members can update their own profile" on public.profiles;
drop policy "admins can update profiles in their organization" on public.profiles;

create policy "members can update their own profile or admins can update their org's"
  on public.profiles for update
  to authenticated
  using (
    id = (select auth.uid())
    or (organization_id = public.current_org_id() and public.is_org_admin())
  )
  with check (
    (id = (select auth.uid()) and organization_id = public.current_org_id())
    or (organization_id = public.current_org_id() and public.is_org_admin())
  );

drop policy "users can read their own notifications" on public.notifications;
create policy "users can read their own notifications"
  on public.notifications for select
  to authenticated
  using (profile_id = (select auth.uid()));

drop policy "users can update their own notifications" on public.notifications;
create policy "users can update their own notifications"
  on public.notifications for update
  to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));
