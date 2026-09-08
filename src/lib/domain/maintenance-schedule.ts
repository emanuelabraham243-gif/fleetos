export type MaintenanceScheduleRuleType = "TIME" | "MILEAGE" | "TIME_AND_MILEAGE";

/** "Every 6 months", "Every 10,000 km", "Every 6 months or 10,000 km" -- never assumed, always derived from which interval fields are actually set. */
export function deriveScheduleRuleType(schedule: {
  interval_km: number | null;
  interval_days: number | null;
}): MaintenanceScheduleRuleType | null {
  const hasKm = schedule.interval_km !== null;
  const hasDays = schedule.interval_days !== null;
  if (hasKm && hasDays) return "TIME_AND_MILEAGE";
  if (hasKm) return "MILEAGE";
  if (hasDays) return "TIME";
  return null;
}

/**
 * A schedule's *current* due state -- distinct from `record_state`-style
 * lifecycle statuses elsewhere in the app. CANCELLED here means the
 * schedule itself is inactive (`is_active = false`); there is no COMPLETED
 * value because a specific service being done doesn't end a recurring
 * schedule, it just starts a new UPCOMING cycle (see `computeMaintenanceDue`).
 */
export type MaintenanceDueStatus = "UPCOMING" | "DUE_SOON" | "DUE" | "OVERDUE" | "CANCELLED";

const SOON_THRESHOLD_KM = 1500;
const SOON_THRESHOLD_DAYS = 14;

const STATUS_SEVERITY: Record<Exclude<MaintenanceDueStatus, "CANCELLED">, number> = {
  UPCOMING: 0,
  DUE_SOON: 1,
  DUE: 2,
  OVERDUE: 3,
};

function statusFromRemaining(
  remaining: number | null,
  soonThreshold: number,
): Exclude<MaintenanceDueStatus, "CANCELLED"> | null {
  if (remaining === null) return null;
  if (remaining < 0) return "OVERDUE";
  if (remaining === 0) return "DUE";
  if (remaining <= soonThreshold) return "DUE_SOON";
  return "UPCOMING";
}

function worseStatus(
  a: Exclude<MaintenanceDueStatus, "CANCELLED"> | null,
  b: Exclude<MaintenanceDueStatus, "CANCELLED"> | null,
): Exclude<MaintenanceDueStatus, "CANCELLED"> | null {
  if (a === null) return b;
  if (b === null) return a;
  return STATUS_SEVERITY[a] >= STATUS_SEVERITY[b] ? a : b;
}

export interface MaintenanceDueInput {
  is_active: boolean;
  interval_km: number | null;
  interval_days: number | null;
  last_done_at: string | null;
  last_done_odometer_km: number | null;
}

export interface MaintenanceDueResult {
  ruleType: MaintenanceScheduleRuleType | null;
  /** null when the status can't be determined at all (no interval configured, or a mileage-only rule with no reliable current mileage). */
  status: MaintenanceDueStatus | null;
  remainingKm: number | null;
  remainingDays: number | null;
  /** UNKNOWN whenever the rule needs mileage but no verified current odometer reading exists -- never fabricate a due calculation from an unreliable number. */
  mileageStatus: "KNOWN" | "UNKNOWN" | "NOT_APPLICABLE";
}

/**
 * Deterministic due calculation. `currentOdometerKm` must come from a real,
 * provenanced source (see `lib/data/fuel.ts`'s `getVehicleOdometerProvenance`
 * from Phase 6, or the vehicle's own manual reading) -- never GPS mileage
 * without clear provenance. If it's null but the rule needs mileage, the
 * mileage-dependent half of the calculation is left unknown rather than
 * guessed; under a TIME_AND_MILEAGE (OR) rule the time half can still make
 * the service due on its own.
 */
export function computeMaintenanceDue(
  schedule: MaintenanceDueInput,
  currentOdometerKm: number | null,
  now: Date = new Date(),
): MaintenanceDueResult {
  const ruleType = deriveScheduleRuleType(schedule);
  const needsMileage = ruleType === "MILEAGE" || ruleType === "TIME_AND_MILEAGE";
  const mileageStatus: MaintenanceDueResult["mileageStatus"] = !needsMileage
    ? "NOT_APPLICABLE"
    : currentOdometerKm !== null && schedule.last_done_odometer_km !== null
      ? "KNOWN"
      : "UNKNOWN";

  if (!schedule.is_active) {
    return { ruleType, status: "CANCELLED", remainingKm: null, remainingDays: null, mileageStatus };
  }
  if (ruleType === null) {
    return { ruleType: null, status: null, remainingKm: null, remainingDays: null, mileageStatus };
  }

  const remainingKm =
    schedule.interval_km !== null && currentOdometerKm !== null && schedule.last_done_odometer_km !== null
      ? schedule.last_done_odometer_km + schedule.interval_km - currentOdometerKm
      : null;

  let remainingDays: number | null = null;
  if (schedule.interval_days !== null && schedule.last_done_at !== null) {
    const dueDate = new Date(schedule.last_done_at);
    dueDate.setDate(dueDate.getDate() + schedule.interval_days);
    remainingDays = Math.ceil((dueDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
  }

  const kmStatus = schedule.interval_km !== null ? statusFromRemaining(remainingKm, SOON_THRESHOLD_KM) : null;
  const dayStatus = schedule.interval_days !== null ? statusFromRemaining(remainingDays, SOON_THRESHOLD_DAYS) : null;

  const status = ruleType === "MILEAGE" ? kmStatus : ruleType === "TIME" ? dayStatus : worseStatus(kmStatus, dayStatus);

  return { ruleType, status, remainingKm, remainingDays, mileageStatus };
}
