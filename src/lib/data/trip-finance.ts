import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

export interface TripFinancialSummary {
  /** null means no rows exist yet -- never rendered as 0, which would claim knowledge FleetOS doesn't have. */
  revenue: number | null;
  /** Fuel/expenses recorded for this trip's vehicle during the trip's own time window -- a correlation, not a direct link (neither table has a trip_id), so it is labeled as such wherever it's displayed. */
  fuelCostDuringTrip: number | null;
  expensesDuringTrip: number | null;
  currency: string;
}

const DEFAULT_CURRENCY = "ETB";

/**
 * Revenue is directly trip-attributed (revenues.trip_id). Fuel and general
 * expenses have no trip_id in the schema -- they're vehicle-scoped only --
 * so they can only be correlated to a trip by time window (occurred_at
 * falling between the trip's start and end, or now if still in progress).
 * That correlation is presented as "during this trip", never as "trip
 * cost", so nothing here overclaims a link the data doesn't actually have.
 */
export async function getTripFinancialSummary(
  supabase: SupabaseClient<Database>,
  trip: {
    id: string;
    vehicle_id: string;
    actual_start: string | null;
    scheduled_start: string | null;
    actual_end: string | null;
  },
): Promise<TripFinancialSummary> {
  const windowStart = trip.actual_start ?? trip.scheduled_start;

  const [revenueRes, fuelRes, expensesRes] = await Promise.all([
    supabase.from("revenues").select("amount, currency").eq("status", "active").eq("trip_id", trip.id),
    windowStart
      ? supabase
          .from("fuel_transactions")
          .select("total_amount, currency")
          .eq("status", "active")
          .eq("vehicle_id", trip.vehicle_id)
          .gte("occurred_at", windowStart)
          .lte("occurred_at", trip.actual_end ?? new Date().toISOString())
      : Promise.resolve({ data: [], error: null }),
    windowStart
      ? supabase
          .from("expenses")
          .select("amount, currency")
          .eq("status", "active")
          .eq("vehicle_id", trip.vehicle_id)
          .gte("occurred_at", windowStart)
          .lte("occurred_at", trip.actual_end ?? new Date().toISOString())
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (revenueRes.error) throw new Error(`Failed to load trip revenue: ${revenueRes.error.message}`);
  if (fuelRes.error) throw new Error(`Failed to load trip fuel cost: ${fuelRes.error.message}`);
  if (expensesRes.error) throw new Error(`Failed to load trip expenses: ${expensesRes.error.message}`);

  const currency =
    revenueRes.data?.[0]?.currency ?? fuelRes.data?.[0]?.currency ?? expensesRes.data?.[0]?.currency ?? DEFAULT_CURRENCY;

  const sum = (rows: { amount?: number; total_amount?: number }[] | null) => {
    if (!rows || rows.length === 0) return null;
    return rows.reduce((total, row) => total + Number(row.amount ?? row.total_amount ?? 0), 0);
  };

  const round = (value: number | null) => (value === null ? null : Math.round(value * 100) / 100);

  return {
    revenue: round(sum(revenueRes.data)),
    fuelCostDuringTrip: round(sum(fuelRes.data)),
    expensesDuringTrip: round(sum(expensesRes.data)),
    currency,
  };
}
