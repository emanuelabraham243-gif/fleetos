export type GpsStatus = "live" | "delayed" | "offline" | "unknown";

const LIVE_THRESHOLD_MS = 5 * 60 * 1000; // <= 5 minutes old
const DELAYED_THRESHOLD_MS = 20 * 60 * 1000; // <= 20 minutes old

/**
 * Turns "when was this vehicle last heard from" into a status a dispatcher
 * can trust. A vehicle is never reported LIVE just because it exists in
 * the fleet -- only a recent, real GPS fix earns that word.
 *
 *   2 minutes old  -> LIVE
 *   15 minutes old -> DELAYED
 *   60 minutes old -> OFFLINE
 *   no fix ever    -> UNKNOWN
 */
export function computeGpsStatus(
  recordedAt: string | null | undefined,
  now: Date = new Date(),
): GpsStatus {
  if (!recordedAt) {
    return "unknown";
  }

  const recordedAtMs = new Date(recordedAt).getTime();
  if (Number.isNaN(recordedAtMs)) {
    return "unknown";
  }

  const ageMs = now.getTime() - recordedAtMs;
  if (ageMs < 0) {
    // Clock skew from the device -- treat as live rather than invent a status.
    return "live";
  }
  if (ageMs <= LIVE_THRESHOLD_MS) {
    return "live";
  }
  if (ageMs <= DELAYED_THRESHOLD_MS) {
    return "delayed";
  }
  return "offline";
}

export const GPS_STATUS_LABEL: Record<GpsStatus, string> = {
  live: "Live",
  delayed: "Delayed",
  offline: "Offline",
  unknown: "Unknown",
};
