import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

export type FuelTransaction = Database["public"]["Tables"]["fuel_transactions"]["Row"] & {
  driver: Pick<Database["public"]["Tables"]["drivers"]["Row"], "id" | "full_name"> | null;
};

export async function getVehicleFuelTransactions(
  supabase: SupabaseClient<Database>,
  vehicleId: string,
): Promise<FuelTransaction[]> {
  const { data, error } = await supabase
    .from("fuel_transactions")
    .select("*, driver:drivers(id, full_name)")
    .eq("vehicle_id", vehicleId)
    .order("occurred_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load fuel transactions: ${error.message}`);
  }

  return data;
}

export interface FuelMetrics {
  totalLiters: number;
  totalCost: number;
  averageCostPerLiter: number;
  /** null when there isn't enough odometer spread to compute a rate -- never a guessed number. */
  costPerKm: number | null;
  currency: string;
}

/**
 * Only computes what the data actually supports. `costPerKm` needs at
 * least two transactions with distinct odometer readings on the *active*
 * (non-voided) transactions -- otherwise it's left null and the UI shows
 * "Insufficient data" rather than a number nobody should trust.
 */
export function computeFuelMetrics(transactions: FuelTransaction[]): FuelMetrics | null {
  const active = transactions.filter((t) => t.status === "active");
  if (active.length === 0) return null;

  const totalLiters = active.reduce((sum, t) => sum + Number(t.volume_liters), 0);
  const totalCost = active.reduce((sum, t) => sum + Number(t.total_amount), 0);
  const currency = active[0].currency;

  const odometers = active
    .map((t) => t.odometer_km)
    .filter((km): km is number => km !== null)
    .sort((a, b) => a - b);

  let costPerKm: number | null = null;
  if (odometers.length >= 2) {
    const distanceCovered = odometers[odometers.length - 1] - odometers[0];
    if (distanceCovered > 0) {
      costPerKm = totalCost / distanceCovered;
    }
  }

  return {
    totalLiters: Math.round(totalLiters * 10) / 10,
    totalCost: Math.round(totalCost * 100) / 100,
    averageCostPerLiter: Math.round((totalCost / totalLiters) * 100) / 100,
    costPerKm: costPerKm !== null ? Math.round(costPerKm * 100) / 100 : null,
    currency,
  };
}
