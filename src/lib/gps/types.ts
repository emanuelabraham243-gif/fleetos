import type { Database } from "@/lib/supabase/database.types";

export type MovementState = Database["public"]["Enums"]["movement_state"];

/**
 * The one shape every GPS integration must normalize into before it
 * touches the rest of FleetOS. A REST poll, a webhook delivery, an MQTT
 * message, a TCP frame, a CSV row, or a mock tick all become this -- so
 * nothing downstream (ingestion, status, UI) ever needs to know which
 * vendor or transport produced it.
 */
export interface NormalizedGpsEvent {
  /** The device identifier as the provider knows it (matches vehicle_devices.external_device_id). */
  externalDeviceId: string;
  /** When the device itself recorded this fix (not when FleetOS received it). */
  recordedAt: string;
  latitude: number;
  longitude: number;
  speedKph: number | null;
  headingDegrees: number | null;
  ignitionOn: boolean | null;
  odometerKm: number | null;
  movementState: MovementState;
  /** The untouched original payload, kept as evidence. */
  rawPayload: unknown;
}

/** Everything an adapter needs to know about the connection it's serving. */
export interface GpsProviderContext {
  connectionId: string;
  organizationId: string;
  /** Adapter-specific settings from gps_connections.config (API base URL, topic, poll interval, ...). */
  config: Record<string, unknown>;
  /** ISO timestamp of the last successful sync, for incremental pulls. Undefined on first run. */
  since?: string;
}

/**
 * The adapter contract. A provider implements only the side of it that
 * matches how it's integrated:
 *
 * - Pull-based (REST poll, CSV/Excel import, direct DB link, the mock feed):
 *   implement `fetchEvents`. Something on a schedule calls it and inserts
 *   what comes back.
 * - Push-based (webhook, MQTT, TCP/socket, vendor SDK callback): implement
 *   `normalizePayload`. A listener/endpoint specific to that transport
 *   calls it per inbound message and inserts the result.
 *
 * Either way the output is the same `NormalizedGpsEvent[]`, so ingestion,
 * storage, and the UI are written once against that shape and never
 * against a specific vendor's API.
 */
export interface GpsProvider {
  readonly slug: string;
  fetchEvents?(context: GpsProviderContext): Promise<NormalizedGpsEvent[]>;
  normalizePayload?(raw: unknown, context: GpsProviderContext): NormalizedGpsEvent[];
}
