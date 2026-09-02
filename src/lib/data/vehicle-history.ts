import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { ActivityEvent, ActivityEventType } from "@/lib/data/activity";
import { describeActivityEvent } from "@/lib/i18n/describe-activity";
import type { Database } from "@/lib/supabase/database.types";

export interface VehicleHistoryEvent {
  id: string;
  timestamp: string;
  actorName: string | null;
  description: string;
}

function describeVehicleAuditEvent(row: {
  action: string;
  previous_value: unknown;
  new_value: unknown;
}): string {
  const prev = row.previous_value as Record<string, unknown> | null;
  const next = row.new_value as Record<string, unknown> | null;

  if (row.action === "delete") return "Vehicle record deleted";
  if (prev && next && prev.status !== next.status) {
    return `Status changed from ${String(prev.status)} to ${String(next.status)}`;
  }
  if (prev && next && prev.odometer_km !== next.odometer_km) {
    return `Odometer updated to ${Number(next.odometer_km).toLocaleString()} km`;
  }
  return "Vehicle information updated";
}

/**
 * The vehicle's full operational history, combined from three sources
 * that already exist for other reasons: `audit_logs` (field-level edits,
 * from the Phase 1 audit trigger), `recent_activity_feed` (trip/fuel/GPS/
 * maintenance events, from Phase 2), and `vehicle_driver_assignments`
 * (open + close events). Nothing is written or duplicated here -- this
 * just reads and merges what already exists.
 */
export async function getVehicleHistory(
  supabase: SupabaseClient<Database>,
  vehicleId: string,
): Promise<VehicleHistoryEvent[]> {
  const [auditRes, activityRes, assignmentsRes] = await Promise.all([
    supabase
      .from("audit_logs")
      .select("id, created_at, action, previous_value, new_value, actor:profiles(id, full_name)")
      .eq("table_name", "vehicles")
      .eq("record_id", vehicleId)
      .order("created_at", { ascending: false }),
    supabase
      .from("recent_activity_feed")
      .select("*")
      .eq("vehicle_id", vehicleId)
      .order("occurred_at", { ascending: false })
      .limit(30),
    supabase
      .from("vehicle_driver_assignments")
      .select("id, assigned_at, unassigned_at, driver:drivers(id, full_name), assigned_by_profile:profiles(id, full_name)")
      .eq("vehicle_id", vehicleId)
      .order("assigned_at", { ascending: false }),
  ]);

  if (auditRes.error) throw new Error(`Failed to load vehicle audit log: ${auditRes.error.message}`);
  if (activityRes.error) throw new Error(`Failed to load vehicle activity: ${activityRes.error.message}`);
  if (assignmentsRes.error) {
    throw new Error(`Failed to load assignment history: ${assignmentsRes.error.message}`);
  }

  const events: VehicleHistoryEvent[] = [];

  for (const row of auditRes.data ?? []) {
    events.push({
      id: `audit-${row.id}`,
      timestamp: row.created_at,
      actorName: row.actor?.full_name ?? null,
      description: describeVehicleAuditEvent(row),
    });
  }

  for (const row of activityRes.data ?? []) {
    if (!row.event_type || !row.occurred_at || !row.record_id) continue;
    const activityEvent: ActivityEvent = {
      eventType: row.event_type as ActivityEventType,
      recordId: row.record_id,
      vehicleId: row.vehicle_id,
      driverId: row.driver_id,
      occurredAt: row.occurred_at,
      details: (row.details as Record<string, unknown>) ?? {},
    };
    events.push({
      id: `activity-${row.record_id}-${row.event_type}`,
      timestamp: row.occurred_at,
      actorName: null,
      description: describeActivityEvent(activityEvent, { unitNumber: null }),
    });
  }

  for (const assignment of assignmentsRes.data ?? []) {
    const driverName = assignment.driver?.full_name ?? "a driver";
    const byName = assignment.assigned_by_profile?.full_name ?? null;
    events.push({
      id: `assignment-open-${assignment.id}`,
      timestamp: assignment.assigned_at,
      actorName: byName,
      description: `Vehicle assigned to ${driverName}`,
    });
    if (assignment.unassigned_at) {
      events.push({
        id: `assignment-close-${assignment.id}`,
        timestamp: assignment.unassigned_at,
        actorName: byName,
        description: `Driver assignment to ${driverName} ended`,
      });
    }
  }

  return events.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}
