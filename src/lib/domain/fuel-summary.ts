export interface FuelSummaryInput {
  vehicleId: string;
  odometerKm: number | null;
  volumeLiters: number;
  totalAmount: number;
  currency: string;
}

export interface FuelSummary {
  transactionCount: number;
  vehiclesFueled: number;
  totalLiters: number;
  totalCost: number;
  currency: string;
  /** null when no fuel was bought in range -- never a divide-by-zero 0. */
  averagePricePerLiter: number | null;
  /**
   * null unless at least one vehicle in this set has two odometer readings
   * within the filtered range. Mirrors the existing per-vehicle
   * `computeFuelMetrics.costPerKm` convention (total cost over the full
   * odometer spread) rather than the newer "exclude first fill" one, so a
   * fleet-wide summary card and a Vehicle Detail card never disagree about
   * what "cost per km" means.
   */
  costPerKm: number | null;
}

/**
 * Pure combine over already-fetched fuel transaction rows -- no query of
 * its own. Distance is computed per vehicle (odometers don't share a scale
 * across vehicles) and summed only across vehicles that actually have two
 * or more odometer readings in the set; a vehicle with none or one
 * reading contributes fuel cost/liters to the totals but nothing to the
 * distance denominator.
 */
export function computeFuelSummary(transactions: FuelSummaryInput[]): FuelSummary {
  const totalLiters = transactions.reduce((sum, t) => sum + Number(t.volumeLiters), 0);
  const totalCost = transactions.reduce((sum, t) => sum + Number(t.totalAmount), 0);
  const vehicleIds = new Set(transactions.map((t) => t.vehicleId));

  const byVehicle = new Map<string, FuelSummaryInput[]>();
  for (const t of transactions) {
    const list = byVehicle.get(t.vehicleId);
    if (list) {
      list.push(t);
    } else {
      byVehicle.set(t.vehicleId, [t]);
    }
  }

  let totalDistanceKm = 0;
  for (const vehicleTransactions of byVehicle.values()) {
    const odometers = vehicleTransactions
      .map((t) => t.odometerKm)
      .filter((km): km is number => km !== null)
      .sort((a, b) => a - b);
    if (odometers.length >= 2) {
      const distance = odometers[odometers.length - 1] - odometers[0];
      if (distance > 0) totalDistanceKm += distance;
    }
  }

  return {
    transactionCount: transactions.length,
    vehiclesFueled: vehicleIds.size,
    totalLiters: Math.round(totalLiters * 10) / 10,
    totalCost: Math.round(totalCost * 100) / 100,
    currency: transactions[0]?.currency ?? "ETB",
    averagePricePerLiter: totalLiters > 0 ? Math.round((totalCost / totalLiters) * 100) / 100 : null,
    costPerKm: totalDistanceKm > 0 ? Math.round((totalCost / totalDistanceKm) * 100) / 100 : null,
  };
}
