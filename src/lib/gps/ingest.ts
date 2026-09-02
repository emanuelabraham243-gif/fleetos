import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

import type { NormalizedGpsEvent } from "./types";

/**
 * Turns normalized events from any adapter into rows in `gps_events`. The
 * `vehicle_locations` "latest position" cache updates itself via the
 * database trigger on insert, so callers never touch it directly.
 */
export async function ingestGpsEvents(
  supabase: SupabaseClient<Database>,
  connectionId: string,
  events: NormalizedGpsEvent[],
): Promise<{ inserted: number; skipped: number }> {
  if (events.length === 0) {
    return { inserted: 0, skipped: 0 };
  }

  const { data: devices, error: devicesError } = await supabase
    .from("vehicle_devices")
    .select("id, vehicle_id, organization_id, external_device_id")
    .eq("gps_connection_id", connectionId)
    .eq("is_active", true);

  if (devicesError) {
    throw new Error(`Failed to load vehicle devices: ${devicesError.message}`);
  }

  const deviceByExternalId = new Map(
    (devices ?? []).map((device) => [device.external_device_id, device]),
  );

  const rows: Database["public"]["Tables"]["gps_events"]["Insert"][] = [];
  let skipped = 0;

  for (const event of events) {
    const device = deviceByExternalId.get(event.externalDeviceId);
    if (!device) {
      skipped += 1;
      continue;
    }

    rows.push({
      organization_id: device.organization_id,
      vehicle_device_id: device.id,
      vehicle_id: device.vehicle_id,
      recorded_at: event.recordedAt,
      latitude: event.latitude,
      longitude: event.longitude,
      speed_kph: event.speedKph,
      heading_degrees: event.headingDegrees,
      ignition_on: event.ignitionOn,
      odometer_km: event.odometerKm,
      movement_state: event.movementState,
      raw_payload: event.rawPayload as never,
    });
  }

  if (rows.length === 0) {
    return { inserted: 0, skipped };
  }

  const { error: insertError } = await supabase.from("gps_events").insert(rows);
  if (insertError) {
    throw new Error(`Failed to insert gps_events: ${insertError.message}`);
  }

  return { inserted: rows.length, skipped };
}
