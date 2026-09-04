export type DateRangePreset = "today" | "this_week" | "this_month" | "last_month" | "custom";

export interface DateRange {
  /** Inclusive start, UTC ISO instant. */
  startIso: string;
  /** Exclusive end, UTC ISO instant. */
  endIso: string;
}

/** Ethiopia does not observe daylight saving, so a fixed offset is correct year-round. */
const ADDIS_ABABA_UTC_OFFSET_MS = 3 * 60 * 60 * 1000;

function toAddisAbabaWallClock(instant: Date): Date {
  return new Date(instant.getTime() + ADDIS_ABABA_UTC_OFFSET_MS);
}

/** Takes a Date whose UTC fields represent an Addis Ababa wall-clock moment and returns the real UTC instant. */
function fromAddisAbabaWallClock(wallClock: Date): Date {
  return new Date(wallClock.getTime() - ADDIS_ABABA_UTC_OFFSET_MS);
}

/**
 * Resolves a preset to UTC instant boundaries computed against the
 * *Addis Ababa* calendar day/week/month -- "This Month" means the month as
 * it reads on a wall clock in Addis Ababa, not whatever month UTC midnight
 * happens to fall in. "custom" passes through caller-supplied bounds
 * unchanged (already real UTC instants from a date picker).
 */
export function resolveDateRange(
  preset: DateRangePreset,
  custom?: { startIso: string; endIso: string },
): DateRange {
  if (preset === "custom") {
    if (!custom) throw new Error("Custom date range requires startIso and endIso.");
    return custom;
  }

  const nowAddis = toAddisAbabaWallClock(new Date());

  if (preset === "today") {
    const start = new Date(Date.UTC(nowAddis.getUTCFullYear(), nowAddis.getUTCMonth(), nowAddis.getUTCDate()));
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    return { startIso: fromAddisAbabaWallClock(start).toISOString(), endIso: fromAddisAbabaWallClock(end).toISOString() };
  }

  if (preset === "this_week") {
    const daysSinceMonday = (nowAddis.getUTCDay() + 6) % 7;
    const start = new Date(
      Date.UTC(nowAddis.getUTCFullYear(), nowAddis.getUTCMonth(), nowAddis.getUTCDate() - daysSinceMonday),
    );
    const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
    return { startIso: fromAddisAbabaWallClock(start).toISOString(), endIso: fromAddisAbabaWallClock(end).toISOString() };
  }

  if (preset === "this_month") {
    const start = new Date(Date.UTC(nowAddis.getUTCFullYear(), nowAddis.getUTCMonth(), 1));
    const end = new Date(Date.UTC(nowAddis.getUTCFullYear(), nowAddis.getUTCMonth() + 1, 1));
    return { startIso: fromAddisAbabaWallClock(start).toISOString(), endIso: fromAddisAbabaWallClock(end).toISOString() };
  }

  const start = new Date(Date.UTC(nowAddis.getUTCFullYear(), nowAddis.getUTCMonth() - 1, 1));
  const end = new Date(Date.UTC(nowAddis.getUTCFullYear(), nowAddis.getUTCMonth(), 1));
  return { startIso: fromAddisAbabaWallClock(start).toISOString(), endIso: fromAddisAbabaWallClock(end).toISOString() };
}

export const DATE_RANGE_PRESET_LABEL: Record<DateRangePreset, string> = {
  today: "Today",
  this_week: "This Week",
  this_month: "This Month",
  last_month: "Last Month",
  custom: "Custom",
};
