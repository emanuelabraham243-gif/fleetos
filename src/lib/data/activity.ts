import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

export type ActivityEventType =
  | "TRIP_STATUS_CHANGED"
  | "FUEL_RECORDED"
  | "GPS_UPDATED"
  | "MAINTENANCE_COMPLETED";

export interface ActivityEvent {
  eventType: ActivityEventType;
  recordId: string;
  vehicleId: string | null;
  driverId: string | null;
  occurredAt: string;
  details: Record<string, unknown>;
}

/**
 * Reads `recent_activity_feed` (a view unioning trips/fuel/gps/maintenance
 * events -- see supabase/migrations) rather than querying each source
 * table separately here. Returns raw facts only; the caller resolves
 * vehicle/driver names from data it already has (the fleet board, the
 * driver roster) instead of this module re-querying them.
 */
export async function getRecentActivity(
  supabase: SupabaseClient<Database>,
  limit = 15,
): Promise<ActivityEvent[]> {
  const { data, error } = await supabase
    .from("recent_activity_feed")
    .select("*")
    .order("occurred_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to load recent activity: ${error.message}`);
  }

  return (data ?? [])
    .filter(
      (row): row is typeof row & { event_type: string; occurred_at: string; record_id: string } =>
        row.event_type !== null && row.occurred_at !== null && row.record_id !== null,
    )
    .map((row) => ({
      eventType: row.event_type as ActivityEventType,
      recordId: row.record_id,
      vehicleId: row.vehicle_id,
      driverId: row.driver_id,
      occurredAt: row.occurred_at,
      details: (row.details as Record<string, unknown>) ?? {},
    }));
}
