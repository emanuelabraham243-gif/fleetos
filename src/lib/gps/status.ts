import { GPS_STATUS_THRESHOLDS } from "./config";

export type GpsStatus = "live" | "delayed" | "offline" | "unknown";

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
  if (ageMs <= GPS_STATUS_THRESHOLDS.liveMaxAgeMs) {
    return "live";
  }
  if (ageMs <= GPS_STATUS_THRESHOLDS.delayedMaxAgeMs) {
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

function formatRelativeAge(ageMs: number): string {
  const minutes = Math.round(ageMs / 60_000);
  if (minutes < 1) return "less than a minute ago";
  if (minutes === 1) return "1 minute ago";
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.round(minutes / 60);
  if (hours === 1) return "1 hour ago";
  return `${hours} hours ago`;
}

/**
 * The one place that turns a raw timestamp into the sentence a dispatcher
 * reads ("Updated 2 min ago" vs "Last signal 47 min ago") -- so a stale fix
 * is never presented with the same confidence as a fresh one, and every
 * screen that shows GPS freshness says it the same way.
 */
export function formatGpsFreshness(
  recordedAt: string | null | undefined,
  now: Date = new Date(),
): { status: GpsStatus; label: string } {
  const status = computeGpsStatus(recordedAt, now);

  if (status === "unknown" || !recordedAt) {
    return { status, label: "No GPS data received yet" };
  }

  const ageMs = Math.max(0, now.getTime() - new Date(recordedAt).getTime());
  const prefix = status === "offline" ? "Last signal" : "Updated";
  return { status, label: `${prefix} ${formatRelativeAge(ageMs)}` };
}
