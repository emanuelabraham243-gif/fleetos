import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { TRIP_STATUS_LABEL, DELIVERY_STATUS_LABEL, TRIP_STOP_STATUS_LABEL } from "@/lib/i18n/labels";
import type { TripStatus } from "@/lib/domain/trip";
import type { DeliveryStatus } from "@/lib/domain/delivery";
import type { TripStopStatus } from "@/lib/domain/trip-stop";
import type { Database } from "@/lib/supabase/database.types";

export interface TripTimelineEvent {
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

function describeTripAudit(row: AuditRow): string {
  const prev = row.previous_value as Record<string, unknown> | null;
  const next = row.new_value as Record<string, unknown> | null;

  if (row.action === "delete") return "Trip record deleted";
  if (prev && next && prev.status !== next.status) {
    const from = TRIP_STATUS_LABEL[prev.status as TripStatus] ?? String(prev.status);
    const to = TRIP_STATUS_LABEL[next.status as TripStatus] ?? String(next.status);
    return `Trip status changed from ${from} to ${to}`;
  }
  if (prev && next && prev.vehicle_id !== next.vehicle_id) return "Trip reassigned to a different vehicle";
  if (prev && next && prev.driver_id !== next.driver_id) return "Trip reassigned to a different driver";
  return "Trip details updated";
}

function describeStopAudit(row: AuditRow, stopLocation: string | null): string {
  const prev = row.previous_value as Record<string, unknown> | null;
  const next = row.new_value as Record<string, unknown> | null;
  const location = stopLocation ?? "a stop";

  if (row.action === "delete") return `Stop at ${location} removed`;
  if (prev && next && prev.status !== next.status) {
    const to = TRIP_STOP_STATUS_LABEL[next.status as TripStopStatus] ?? String(next.status);
    return `Stop at ${location} marked ${to.toLowerCase()}`;
  }
  return `Stop at ${location} updated`;
}

function describeDeliveryAudit(row: AuditRow, deliveryNumber: string | null): string {
  const prev = row.previous_value as Record<string, unknown> | null;
  const next = row.new_value as Record<string, unknown> | null;
  const label = deliveryNumber ? `Delivery ${deliveryNumber}` : "A delivery";

  if (row.action === "delete") return `${label} record deleted`;
  if (prev && next && prev.status !== next.status) {
    const to = DELIVERY_STATUS_LABEL[next.status as DeliveryStatus] ?? String(next.status);
    return `${label} marked ${to.toLowerCase()}`;
  }
  return `${label} updated`;
}

const AUDIT_SELECT = "id, created_at, action, previous_value, new_value, actor:profiles(id, full_name)";

/**
 * The Trip Detail timeline: every recorded change to the trip itself, its
 * stops, and its deliveries, merged into one chronological list. This is
 * pure re-reading of the audit trail every table already writes via the
 * shared `record_audit_event()` trigger -- nothing new is written here,
 * matching the same pattern `getVehicleHistory` already established.
 */
export async function getTripTimeline(
  supabase: SupabaseClient<Database>,
  trip: { id: string; trip_number: string; created_at: string },
): Promise<TripTimelineEvent[]> {
  const [stopsRes, deliveriesRes] = await Promise.all([
    supabase.from("trip_stops").select("id, location").eq("trip_id", trip.id),
    supabase.from("deliveries").select("id, delivery_number").eq("trip_id", trip.id),
  ]);
  if (stopsRes.error) throw new Error(`Failed to load trip stops: ${stopsRes.error.message}`);
  if (deliveriesRes.error) throw new Error(`Failed to load trip deliveries: ${deliveriesRes.error.message}`);

  const stopLocationById = new Map((stopsRes.data ?? []).map((s) => [s.id, s.location] as const));
  const deliveryNumberById = new Map(
    (deliveriesRes.data ?? []).map((d) => [d.id, d.delivery_number] as const),
  );
  const stopIds = [...stopLocationById.keys()];
  const deliveryIds = [...deliveryNumberById.keys()];

  const [tripAuditRes, stopAuditRes, deliveryAuditRes] = await Promise.all([
    supabase
      .from("audit_logs")
      .select(AUDIT_SELECT)
      .eq("table_name", "trips")
      .eq("record_id", trip.id)
      .order("created_at", { ascending: false }),
    stopIds.length > 0
      ? supabase
          .from("audit_logs")
          .select(AUDIT_SELECT)
          .eq("table_name", "trip_stops")
          .in("record_id", stopIds)
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
  if (stopAuditRes.error) throw new Error(`Failed to load stop audit log: ${stopAuditRes.error.message}`);
  if (deliveryAuditRes.error) {
    throw new Error(`Failed to load delivery audit log: ${deliveryAuditRes.error.message}`);
  }

  const events: TripTimelineEvent[] = [
    {
      id: "trip-created",
      timestamp: trip.created_at,
      actorName: null,
      description: `Trip ${trip.trip_number} created`,
    },
  ];

  for (const row of (tripAuditRes.data ?? []) as AuditRow[]) {
    events.push({
      id: `trip-audit-${row.id}`,
      timestamp: row.created_at,
      actorName: row.actor?.full_name ?? null,
      description: describeTripAudit(row),
    });
  }
  for (const row of (stopAuditRes.data ?? []) as (AuditRow & { record_id?: string })[]) {
    events.push({
      id: `stop-audit-${row.id}`,
      timestamp: row.created_at,
      actorName: row.actor?.full_name ?? null,
      description: describeStopAudit(row, stopLocationById.get((row as unknown as { record_id: string }).record_id ?? "") ?? null),
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

  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
