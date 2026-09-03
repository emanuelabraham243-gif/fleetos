import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { getDriverAssignmentHistory } from "@/lib/data/driver-assignments";
import { getDeliveriesByDriverId } from "@/lib/data/deliveries";
import { getTrips } from "@/lib/data/trips";
import type { TripStatus } from "@/lib/domain/trip";
import type { DeliveryStatus } from "@/lib/domain/delivery";
import type { DriverStatus } from "@/lib/domain/driver";
import { DRIVER_STATUS_LABEL, DELIVERY_STATUS_LABEL, TRIP_STATUS_LABEL } from "@/lib/i18n/labels";
import type { Database } from "@/lib/supabase/database.types";

export interface DriverActivityEvent {
  id: string;
  timestamp: string;
  actorName: string | null;
  description: string;
}

type AuditRow = {
  id: string;
  created_at: string;
  action: string;
  previous_value: unknown;
  new_value: unknown;
  actor: { id: string; full_name: string } | null;
};

const AUDIT_SELECT = "id, created_at, action, previous_value, new_value, actor:profiles(id, full_name)";

function describeDriverRecordAudit(row: AuditRow): string {
  const prev = row.previous_value as Record<string, unknown> | null;
  const next = row.new_value as Record<string, unknown> | null;

  if (row.action === "delete") return "Driver record deleted";
  if (prev && next && prev.status !== next.status) {
    const from = DRIVER_STATUS_LABEL[prev.status as DriverStatus] ?? String(prev.status);
    const to = DRIVER_STATUS_LABEL[next.status as DriverStatus] ?? String(next.status);
    return `Driver status changed from ${from} to ${to}`;
  }
  if (prev && next && prev.license_number !== next.license_number) return "License number updated";
  if (prev && next && prev.phone !== next.phone) return "Phone number updated";
  return "Driver record updated";
}

function describeTripAudit(row: AuditRow, tripNumber: string | null): string {
  const prev = row.previous_value as Record<string, unknown> | null;
  const next = row.new_value as Record<string, unknown> | null;
  const label = tripNumber ? `Trip ${tripNumber}` : "A trip";

  if (prev && next && prev.status !== next.status) {
    const to = TRIP_STATUS_LABEL[next.status as TripStatus] ?? String(next.status);
    return `${label} ${to.toLowerCase()}`;
  }
  return `${label} updated`;
}

function describeDeliveryAudit(row: AuditRow, deliveryNumber: string | null): string {
  const prev = row.previous_value as Record<string, unknown> | null;
  const next = row.new_value as Record<string, unknown> | null;
  const label = deliveryNumber ? `Delivery ${deliveryNumber}` : "A delivery";

  if (prev && next && prev.status !== next.status) {
    const to = DELIVERY_STATUS_LABEL[next.status as DeliveryStatus] ?? String(next.status);
    return `${label} marked ${to.toLowerCase()}`;
  }
  return `${label} updated`;
}

/**
 * The driver's full operational history, merged from sources that already
 * exist for other reasons -- the same pattern `getVehicleHistory` and
 * `getTripTimeline` established: `audit_logs` for the driver's own record,
 * their trips, and their deliveries, plus `vehicle_driver_assignments`
 * (open/close events). Nothing new is written here, only read and merged.
 */
export async function getDriverActivity(
  supabase: SupabaseClient<Database>,
  driver: { id: string; full_name: string },
): Promise<DriverActivityEvent[]> {
  const [trips, deliveries, assignmentHistory, driverAuditRes] = await Promise.all([
    getTrips(supabase, { driverId: driver.id }),
    getDeliveriesByDriverId(supabase, driver.id),
    getDriverAssignmentHistory(supabase, driver.id),
    supabase
      .from("audit_logs")
      .select(AUDIT_SELECT)
      .eq("table_name", "drivers")
      .eq("record_id", driver.id)
      .order("created_at", { ascending: false }),
  ]);

  if (driverAuditRes.error) {
    throw new Error(`Failed to load driver audit log: ${driverAuditRes.error.message}`);
  }

  const tripNumberById = new Map(trips.map((trip) => [trip.id, trip.trip_number] as const));
  const deliveryNumberById = new Map(
    deliveries.map((delivery) => [delivery.id, delivery.delivery_number] as const),
  );
  const tripIds = trips.map((trip) => trip.id);
  const deliveryIds = deliveries.map((delivery) => delivery.id);

  const [tripAuditRes, deliveryAuditRes] = await Promise.all([
    tripIds.length > 0
      ? supabase
          .from("audit_logs")
          .select(AUDIT_SELECT)
          .eq("table_name", "trips")
          .in("record_id", tripIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    deliveryIds.length > 0
      ? supabase
          .from("audit_logs")
          .select(AUDIT_SELECT)
          .eq("table_name", "deliveries")
          .in("record_id", deliveryIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (tripAuditRes.error) throw new Error(`Failed to load trip audit log: ${tripAuditRes.error.message}`);
  if (deliveryAuditRes.error) {
    throw new Error(`Failed to load delivery audit log: ${deliveryAuditRes.error.message}`);
  }

  const events: DriverActivityEvent[] = [];

  for (const row of (driverAuditRes.data ?? []) as AuditRow[]) {
    events.push({
      id: `driver-audit-${row.id}`,
      timestamp: row.created_at,
      actorName: row.actor?.full_name ?? null,
      description: describeDriverRecordAudit(row),
    });
  }

  for (const row of (tripAuditRes.data ?? []) as (AuditRow & { record_id?: string })[]) {
    events.push({
      id: `trip-audit-${row.id}`,
      timestamp: row.created_at,
      actorName: row.actor?.full_name ?? null,
      description: describeTripAudit(
        row,
        tripNumberById.get((row as unknown as { record_id: string }).record_id ?? "") ?? null,
      ),
    });
  }

  for (const row of (deliveryAuditRes.data ?? []) as (AuditRow & { record_id?: string })[]) {
    events.push({
      id: `delivery-audit-${row.id}`,
      timestamp: row.created_at,
      actorName: row.actor?.full_name ?? null,
      description: describeDeliveryAudit(
        row,
        deliveryNumberById.get((row as unknown as { record_id: string }).record_id ?? "") ?? null,
      ),
    });
  }

  for (const assignment of assignmentHistory) {
    const unitLabel = assignment.vehicle ? `Unit ${assignment.vehicle.unit_number}` : "a vehicle";
    const byName = assignment.assigned_by_profile?.full_name ?? null;
    events.push({
      id: `assignment-open-${assignment.id}`,
      timestamp: assignment.assigned_at,
      actorName: byName,
      description: `Assigned to ${unitLabel}`,
    });
    if (assignment.unassigned_at) {
      events.push({
        id: `assignment-close-${assignment.id}`,
        timestamp: assignment.unassigned_at,
        actorName: byName,
        description: `Assignment to ${unitLabel} ended`,
      });
    }
  }

  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
