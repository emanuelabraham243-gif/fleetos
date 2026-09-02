/** "09:42" -- used for the activity timeline, where the clock time itself is the useful fact. */
export function formatClockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}
