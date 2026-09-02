-- Extensions
create extension if not exists "pgcrypto" with schema extensions;

-- ============================================================================
-- Enums
-- ============================================================================

-- Roles a profile can hold within its organization.
create type public.org_role as enum (
  'owner',
  'admin',
  'dispatcher',
  'manager',
  'driver',
  'viewer'
);

-- Generic lifecycle state for financial / evidentiary records.
-- These records are never hard-deleted -- only re-stated, so history survives.
create type public.record_state as enum (
  'active',
  'voided',
  'corrected',
  'superseded',
  'archived'
);

-- Distinguishes what kind of claim a piece of recorded information is.
-- Used so the system never silently escalates a FACT into an accusation.
create type public.evidence_kind as enum (
  'fact',
  'calculation',
  'user_input',
  'interpretation',
  'decision'
);

create type public.vehicle_type as enum ('truck', 'van', 'trailer', 'other');
create type public.vehicle_status as enum ('active', 'maintenance', 'out_of_service', 'sold', 'retired');
create type public.fuel_type as enum ('diesel', 'gasoline', 'electric', 'cng', 'other');

create type public.driver_status as enum ('active', 'inactive', 'suspended', 'terminated');

-- How a GPS provider is integrated -- FleetOS must support all of these
-- without redesigning the core, so the adapter layer is keyed on this.
create type public.gps_integration_type as enum (
  'rest_api',
  'webhook',
  'mqtt',
  'tcp_socket',
  'sdk',
  'csv_import',
  'database',
  'manual'
);

create type public.gps_connection_status as enum ('active', 'paused', 'error', 'disconnected');
create type public.movement_state as enum ('moving', 'stationary', 'idle', 'unknown');

create type public.contract_rate_type as enum ('per_mile', 'per_trip', 'flat', 'hourly', 'other');
create type public.contract_status as enum ('draft', 'active', 'expired', 'terminated');

create type public.trip_status as enum ('planned', 'dispatched', 'in_progress', 'completed', 'cancelled');
create type public.trip_stop_type as enum ('pickup', 'dropoff', 'fuel', 'rest', 'other');
create type public.delivery_status as enum ('pending', 'picked_up', 'in_transit', 'delivered', 'failed', 'cancelled');

create type public.expense_category as enum (
  'maintenance', 'insurance', 'permit', 'toll', 'parking', 'fine', 'office', 'other'
);
create type public.invoice_status as enum ('draft', 'sent', 'paid', 'overdue', 'void');
create type public.payment_method as enum ('cash', 'card', 'bank_transfer', 'check', 'other');

create type public.maintenance_issue_source as enum (
  'driver_report', 'inspection', 'gps_anomaly', 'scheduled', 'other'
);
create type public.maintenance_issue_severity as enum ('low', 'medium', 'high', 'critical');
create type public.maintenance_issue_status as enum ('open', 'acknowledged', 'in_progress', 'resolved', 'wont_fix');
create type public.work_order_status as enum ('open', 'in_progress', 'completed', 'cancelled');
create type public.vendor_category as enum ('repair_shop', 'parts_supplier', 'fuel_station', 'insurance', 'other');
create type public.inspection_type as enum ('pre_trip', 'post_trip', 'periodic', 'annual', 'other');

create type public.document_type_vehicle as enum (
  'registration', 'insurance', 'permit', 'inspection_certificate', 'title', 'other'
);
create type public.document_type_driver as enum (
  'license', 'medical_card', 'background_check', 'training_certificate', 'other'
);
create type public.document_status as enum ('active', 'expired', 'pending_renewal', 'archived');

create type public.incident_type as enum (
  'accident', 'traffic_violation', 'mechanical', 'cargo_damage', 'safety', 'other'
);
create type public.incident_severity as enum ('low', 'medium', 'high', 'critical');
create type public.incident_status as enum ('open', 'investigating', 'resolved', 'closed');

create type public.evidence_source as enum ('gps', 'document', 'photo', 'statement', 'system', 'other');

create type public.dispute_type as enum (
  'fuel_variance', 'damage_claim', 'delivery_dispute', 'payment_dispute', 'other'
);
create type public.dispute_status as enum ('open', 'under_review', 'resolved', 'rejected', 'withdrawn');

create type public.alert_type as enum (
  'gps_offline', 'speed_threshold', 'fuel_anomaly', 'document_expiring', 'maintenance_due', 'geofence', 'other'
);
create type public.alert_severity as enum ('info', 'warning', 'critical');
create type public.alert_status as enum ('open', 'acknowledged', 'dismissed', 'resolved');

-- Reusable "updated_at" trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
