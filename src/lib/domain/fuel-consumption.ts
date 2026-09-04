export interface FuelConsumptionInput {
  occurred_at: string;
  odometer_km: number | null;
  volume_liters: number;
}

export interface FuelConsumptionMetrics {
  /** null when fewer than two odometer readings exist -- never a guessed distance. */
  distanceKm: number | null;
  /** Liters bought between the first and last odometer reading -- excludes the first fill, which fueled the vehicle *to* the starting point, not across the measured distance. */
  litersConsumed: number | null;
  litersPer100Km: number | null;
  kmPerLiter: number | null;
}

/**
 * Distance/consumption can only ever be computed between two real odometer
 * readings on real transactions -- never estimated, never assumed from an
 * average. Fewer than two odometer-tagged transactions (or a non-positive
 * distance) means every field here is null, and the UI shows "Insufficient
 * data" rather than a number nobody recorded.
 */
export function computeFuelConsumption(transactions: FuelConsumptionInput[]): FuelConsumptionMetrics {
  const withOdometer = transactions
    .filter((t): t is FuelConsumptionInput & { odometer_km: number } => t.odometer_km !== null)
    .sort((a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime());

  if (withOdometer.length < 2) {
    return { distanceKm: null, litersConsumed: null, litersPer100Km: null, kmPerLiter: null };
  }

  const first = withOdometer[0];
  const last = withOdometer[withOdometer.length - 1];
  const distanceKm = last.odometer_km - first.odometer_km;

  if (distanceKm <= 0) {
    return { distanceKm: null, litersConsumed: null, litersPer100Km: null, kmPerLiter: null };
  }

  const litersConsumed = withOdometer
    .slice(1)
    .reduce((sum, t) => sum + Number(t.volume_liters), 0);

  if (litersConsumed <= 0) {
    return { distanceKm, litersConsumed: null, litersPer100Km: null, kmPerLiter: null };
  }

  return {
    distanceKm: Math.round(distanceKm * 10) / 10,
    litersConsumed: Math.round(litersConsumed * 10) / 10,
    litersPer100Km: Math.round((litersConsumed / distanceKm) * 100 * 10) / 10,
    kmPerLiter: Math.round((distanceKm / litersConsumed) * 100) / 100,
  };
}
