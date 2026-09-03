/**
 * Every operational timestamp in FleetOS is a business record (a trip
 * departed, a fuel purchase happened, an incident occurred) and must read
 * the same way regardless of which browser or device views it. Format
 * everything in Africa/Addis_Ababa -- never rely on the browser's local
 * timezone for a business record.
 */
const TIME_ZONE = "Africa/Addis_Ababa";

/** "09:42" -- used for the activity timeline, where the clock time itself is the useful fact. */
export function formatClockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIME_ZONE,
  });
}

/** "Mar 4" */
export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: TIME_ZONE,
  });
}

/** "Mar 4, 2026" */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: TIME_ZONE,
  });
}

/** "Mar 4, 09:42" */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIME_ZONE,
  });
}

/** "Mar 4, 2026, 09:42" */
export function formatFullDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIME_ZONE,
  });
}
