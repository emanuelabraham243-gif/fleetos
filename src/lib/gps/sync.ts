import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

import { ingestGpsEvents } from "./ingest";
import { getGpsProvider } from "./registry";

/**
 * Runs one pull cycle for a single gps_connection: asks its adapter for the
 * latest event for every active device on that connection, then ingests
 * whatever comes back. This is the piece a scheduler (cron, a "Simulate
 * tick" button in dev, a future queue worker) calls -- it never needs to
 * know which provider is behind the connection.
 */
export async function syncGpsConnection(
  supabase: SupabaseClient<Database>,
  connectionId: string,
): Promise<{ inserted: number; skipped: number }> {
  const { data: connection, error: connectionError } = await supabase
    .from("gps_connections")
    .select("id, organization_id, config, gps_provider:gps_providers(slug)")
    .eq("id", connectionId)
    .single();

  if (connectionError || !connection) {
    throw new Error(
      `Unknown gps_connection ${connectionId}: ${connectionError?.message ?? "not found"}`,
    );
  }

  const provider = getGpsProvider(connection.gps_provider.slug);
  if (!provider?.fetchEvents) {
    throw new Error(
      `Provider "${connection.gps_provider.slug}" has no pull-based fetchEvents adapter`,
    );
  }

  const { data: devices, error: devicesError } = await supabase
    .from("vehicle_devices")
    .select("external_device_id")
    .eq("gps_connection_id", connectionId)
    .eq("is_active", true);

  if (devicesError) {
    throw new Error(`Failed to load devices for connection: ${devicesError.message}`);
  }

  const baseConfig = (connection.config ?? {}) as Record<string, unknown>;
  const events = [];
  for (const device of devices ?? []) {
    const deviceEvents = await provider.fetchEvents({
      connectionId,
      organizationId: connection.organization_id,
      config: { ...baseConfig, externalDeviceId: device.external_device_id },
    });
    events.push(...deviceEvents);
  }

  return ingestGpsEvents(supabase, connectionId, events);
}
