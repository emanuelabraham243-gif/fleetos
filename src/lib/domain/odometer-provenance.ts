export type OdometerSource = "manual" | "fuel_transaction" | "gps" | "maintenance";

export interface OdometerReading {
  source: OdometerSource;
  odometerKm: number;
  recordedAt: string;
  /** id of the row this reading came from (vehicle id for "manual", fuel_transaction id for "fuel_transaction", etc). */
  referenceId: string;
}

export interface OdometerProvenance {
  /** The most recently recorded reading across every source -- what FleetOS treats as "current". */
  latest: OdometerReading | null;
  /** All readings, oldest first, whatever their source. */
  readings: OdometerReading[];
  /** True when a later-recorded reading is lower than an earlier one -- surfaced to the user, never silently resolved. */
  hasConflict: boolean;
}

/**
 * FleetOS only has two real odometer sources today: a manual figure on the
 * vehicle record, and the per-transaction reading on each fuel purchase.
 * "gps" and "maintenance" are recognized here so this shape doesn't need to
 * change when those sources exist, but nothing populates them yet -- this
 * function never fabricates a reading for a source that gave it none.
 */
export function buildOdometerProvenance(readings: OdometerReading[]): OdometerProvenance {
  const sorted = [...readings].sort(
    (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime(),
  );

  let hasConflict = false;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].odometerKm < sorted[i - 1].odometerKm) {
      hasConflict = true;
      break;
    }
  }

  return {
    latest: sorted.length > 0 ? sorted[sorted.length - 1] : null,
    readings: sorted,
    hasConflict,
  };
}

export type OdometerValidation = { ok: true } | { ok: false; error: string };

/**
 * A new fuel-transaction odometer reading must be >= the last known
 * reading from any source -- unless the person recording it gives a
 * reason, in which case the override is allowed but the reason is kept
 * (the caller is responsible for storing it on the row and raising an
 * audit event, never for silently accepting a lower number).
 */
export function validateOdometerReading(params: {
  newOdometerKm: number;
  previousKnownKm: number | null;
  overrideReason?: string | null;
}): OdometerValidation {
  if (params.previousKnownKm === null) return { ok: true };
  if (params.newOdometerKm >= params.previousKnownKm) return { ok: true };
  if (params.overrideReason && params.overrideReason.trim().length > 0) return { ok: true };

  return {
    ok: false,
    error: `New odometer (${params.newOdometerKm.toLocaleString()} km) is lower than the last known reading (${params.previousKnownKm.toLocaleString()} km). Provide a reason to override.`,
  };
}
