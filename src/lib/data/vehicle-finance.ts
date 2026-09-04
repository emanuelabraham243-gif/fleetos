import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { computeFuelConsumption } from "@/lib/domain/fuel-consumption";
import type { Database } from "@/lib/supabase/database.types";

export interface VehicleFinancialSummary {
  /** null means no rows exist yet -- never rendered as 0, which would claim knowledge FleetOS doesn't have. */
  totalRevenue: number | null;
  totalExpenses: number | null;
  fuelCost: number | null;
  maintenanceCost: number | null;
  operatingCost: number | null;
  profit: number | null;
  /** operatingCost / distance covered by this vehicle's fuel-transaction odometer readings. Null unless both are known -- never divided by a guessed distance. */
  costPerKm: number | null;
  currency: string;
}

const DEFAULT_CURRENCY = "ETB";

/**
 * Revenue is trip-scoped in the schema (revenues.trip_id), not
 * vehicle-scoped directly, so it's resolved via this vehicle's own trips.
 * Everything else (`expenses`, `fuel_transactions`, `work_orders`) is
 * already vehicle-scoped. Only `active`/non-void rows count; only sections
 * with at least one row are populated -- nothing here is invented.
 */
export async function getVehicleFinancialSummary(
  supabase: SupabaseClient<Database>,
  vehicleId: string,
): Promise<VehicleFinancialSummary> {
  const { data: trips, error: tripsError } = await supabase
    .from("trips")
    .select("id")
    .eq("vehicle_id", vehicleId);
  if (tripsError) {
    throw new Error(`Failed to load trips for financial summary: ${tripsError.message}`);
  }
  const tripIds = (trips ?? []).map((trip) => trip.id);

  const [revenuesRes, expensesRes, fuelRes, workOrdersRes] = await Promise.all([
    tripIds.length > 0
      ? supabase.from("revenues").select("amount, currency").eq("status", "active").in("trip_id", tripIds)
      : Promise.resolve({ data: [], error: null }),
    supabase.from("expenses").select("amount, currency").eq("status", "active").eq("vehicle_id", vehicleId),
    supabase
      .from("fuel_transactions")
      .select("total_amount, currency, occurred_at, odometer_km")
      .eq("status", "active")
      .eq("vehicle_id", vehicleId),
    supabase
      .from("work_orders")
      .select("total_cost, currency")
      .eq("vehicle_id", vehicleId)
      .not("status", "eq", "cancelled")
      .not("total_cost", "is", null),
  ]);

  if (revenuesRes.error) throw new Error(`Failed to load revenues: ${revenuesRes.error.message}`);
  if (expensesRes.error) throw new Error(`Failed to load expenses: ${expensesRes.error.message}`);
  if (fuelRes.error) throw new Error(`Failed to load fuel cost: ${fuelRes.error.message}`);
  if (workOrdersRes.error) throw new Error(`Failed to load maintenance cost: ${workOrdersRes.error.message}`);

  const currency =
    revenuesRes.data?.[0]?.currency ??
    expensesRes.data?.[0]?.currency ??
    fuelRes.data?.[0]?.currency ??
    workOrdersRes.data?.[0]?.currency ??
    DEFAULT_CURRENCY;

  const sum = (rows: { amount?: number; total_amount?: number; total_cost?: number | null }[] | null) => {
    if (!rows || rows.length === 0) return null;
    return rows.reduce((total, row) => total + Number(row.amount ?? row.total_amount ?? row.total_cost ?? 0), 0);
  };

  const totalRevenue = sum(revenuesRes.data);
  const totalExpenses = sum(expensesRes.data);
  const fuelCost = sum(fuelRes.data);
  const maintenanceCost = sum(workOrdersRes.data);

  const costComponents = [totalExpenses, fuelCost, maintenanceCost].filter(
    (value): value is number => value !== null,
  );
  const operatingCost = costComponents.length > 0 ? costComponents.reduce((a, b) => a + b, 0) : null;

  const profit =
    totalRevenue !== null && operatingCost !== null ? totalRevenue - operatingCost : null;

  const { distanceKm } = computeFuelConsumption(
    (fuelRes.data ?? []).map((row) => ({
      occurred_at: row.occurred_at,
      odometer_km: row.odometer_km,
      volume_liters: 0,
    })),
  );
  const costPerKm =
    operatingCost !== null && distanceKm !== null && distanceKm > 0 ? operatingCost / distanceKm : null;

  const round = (value: number | null) => (value === null ? null : Math.round(value * 100) / 100);

  return {
    totalRevenue: round(totalRevenue),
    totalExpenses: round(totalExpenses),
    fuelCost: round(fuelCost),
    maintenanceCost: round(maintenanceCost),
    operatingCost: round(operatingCost),
    profit: round(profit),
    costPerKm: costPerKm !== null ? Math.round(costPerKm * 100) / 100 : null,
    currency,
  };
}
