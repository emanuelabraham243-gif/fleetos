export interface FuelAnomalyInput {
  id: string;
  occurred_at: string;
  odometer_km: number | null;
  volume_liters: number;
  receipt_url: string | null;
}

export type FuelAnomalyKind =
  | "consumption_above_baseline"
  | "consumption_below_baseline"
  | "repeated_transactions"
  | "missing_odometer"
  | "odometer_inconsistency"
  | "missing_receipt";

export interface FuelAnomaly {
  transactionId: string;
  kind: FuelAnomalyKind;
  /** Evidence-framed fact, e.g. "Fuel consumption is 31% above recent vehicle baseline." Never an accusation. */
  description: string;
}

const BASELINE_DEVIATION_THRESHOLD = 0.25;
const REPEATED_TRANSACTION_WINDOW_HOURS = 6;
/** How many prior segments must exist before a baseline is trusted enough to compare against. */
const MIN_BASELINE_SEGMENTS = 2;

/**
 * Every flag here is a fact about the data, evaluated against the
 * vehicle's *own* recent history -- never a judgment about a person.
 * "Review recommended" is the only conclusion this ever reaches; whether
 * something actually went wrong is for a human to investigate.
 */
export function detectFuelAnomalies(transactions: FuelAnomalyInput[]): FuelAnomaly[] {
  const anomalies: FuelAnomaly[] = [];

  const sorted = [...transactions].sort(
    (a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime(),
  );

  for (const t of sorted) {
    if (t.odometer_km === null) {
      anomalies.push({
        transactionId: t.id,
        kind: "missing_odometer",
        description: "No odometer reading recorded for this fuel transaction.",
      });
    }
    if (!t.receipt_url) {
      anomalies.push({
        transactionId: t.id,
        kind: "missing_receipt",
        description: "No receipt on file for this fuel transaction.",
      });
    }
  }

  // Odometer inconsistency + repeated transactions: compare each transaction to earlier ones.
  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const previous = sorted[i - 1];

    if (current.odometer_km !== null && previous.odometer_km !== null) {
      if (current.odometer_km < previous.odometer_km) {
        anomalies.push({
          transactionId: current.id,
          kind: "odometer_inconsistency",
          description: `Recorded odometer (${current.odometer_km} km) is lower than a previous reading (${previous.odometer_km} km) on ${previous.occurred_at}.`,
        });
      }
    }

    const hoursSincePrevious =
      (new Date(current.occurred_at).getTime() - new Date(previous.occurred_at).getTime()) /
      (60 * 60 * 1000);
    if (hoursSincePrevious >= 0 && hoursSincePrevious < REPEATED_TRANSACTION_WINDOW_HOURS) {
      anomalies.push({
        transactionId: current.id,
        kind: "repeated_transactions",
        description: `A previous fuel transaction for this vehicle was recorded ${hoursSincePrevious.toFixed(1)} hours earlier.`,
      });
    }
  }

  // Consumption vs. baseline: build per-segment liters/km rates from consecutive odometer readings.
  const withOdometer = sorted.filter(
    (t): t is FuelAnomalyInput & { odometer_km: number } => t.odometer_km !== null,
  );
  const segments: { transactionId: string; litersPerKm: number }[] = [];
  for (let i = 1; i < withOdometer.length; i++) {
    const distance = withOdometer[i].odometer_km - withOdometer[i - 1].odometer_km;
    if (distance > 0) {
      segments.push({
        transactionId: withOdometer[i].id,
        litersPerKm: Number(withOdometer[i].volume_liters) / distance,
      });
    }
  }

  for (let i = 0; i < segments.length; i++) {
    const priorSegments = segments.slice(0, i);
    if (priorSegments.length < MIN_BASELINE_SEGMENTS) continue;

    const baseline =
      priorSegments.reduce((sum, s) => sum + s.litersPerKm, 0) / priorSegments.length;
    if (baseline <= 0) continue;

    const current = segments[i];
    const deviation = (current.litersPerKm - baseline) / baseline;

    if (deviation > BASELINE_DEVIATION_THRESHOLD) {
      anomalies.push({
        transactionId: current.transactionId,
        kind: "consumption_above_baseline",
        description: `Fuel consumption is ${Math.round(deviation * 100)}% above the vehicle's recent baseline.`,
      });
    } else if (deviation < -BASELINE_DEVIATION_THRESHOLD) {
      anomalies.push({
        transactionId: current.transactionId,
        kind: "consumption_below_baseline",
        description: `Fuel consumption is ${Math.round(Math.abs(deviation) * 100)}% below the vehicle's recent baseline.`,
      });
    }
  }

  return anomalies;
}
