/** Whole days between today (UTC) and a `date` column value. Negative means already past. */
export function daysUntil(dateStr: string, from: Date = new Date()): number {
  const target = new Date(`${dateStr}T00:00:00Z`);
  const todayUtc = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
  return Math.round((target.getTime() - todayUtc) / (24 * 60 * 60 * 1000));
}

/** "due in 5 days" / "overdue by 5 days" / "due today" -- the one phrasing used everywhere a day-count is shown. */
export function formatDueText(days: number, verb: string): string {
  if (days < 0) return `${verb} overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"}`;
  if (days === 0) return `${verb} today`;
  return `${verb} in ${days} day${days === 1 ? "" : "s"}`;
}
