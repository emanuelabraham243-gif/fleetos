import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

export interface TripFinancialSummary {
  /** null means no rows exist yet -- never rendered as 0, which would claim knowledge FleetOS doesn't have. */
  revenue: number | null;
  fuelCost: number | null;
  otherExpensesCost: number | null;
  /** fuelCost + otherExpensesCost -- null only when neither has any rows. */
  totalCost: number | null;
  /** revenue - totalCost. Null whenever revenue hasn't been recorded, even if cost is known -- never a fabricated profit from an assumed revenue. */
  margin: number | null;
  currency: string;
}

const DEFAULT_CURRENCY = "ETB";

/**
 * Fuel and expenses are now directly trip-attributed (fuel_transactions.trip_id,
 * expenses.trip_id, added in Phase 6) rather than correlated by time window --
 * a real foreign key, so "Trip: Unassigned" fuel/expenses never leak into a
 * trip's cost just because they happened during its window. Revenue was
 * already trip-attributed (revenues.trip_id) since Phase 4.
 */
export async function getTripFinancialSummary(
  supabase: SupabaseClient<Database>,
  tripId: string,
): Promise<TripFinancialSummary> {
  const [revenueRes, fuelRes, expensesRes] = await Promise.all([
    supabase.from("revenues").select("amount, currency").eq("status", "active").eq("trip_id", tripId),
    supabase.from("fuel_transactions").select("total_amount, currency").eq("status", "active").eq("trip_id", tripId),
    supabase.from("expenses").select("amount, currency").eq("status", "active").eq("trip_id", tripId),
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

  const revenue = sum(revenueRes.data);
  const fuelCost = sum(fuelRes.data);
  const otherExpensesCost = sum(expensesRes.data);

  const costComponents = [fuelCost, otherExpensesCost].filter((v): v is number => v !== null);
  const totalCost = costComponents.length > 0 ? costComponents.reduce((a, b) => a + b, 0) : null;

  const margin = revenue !== null && totalCost !== null ? revenue - totalCost : null;

  return {
    revenue: round(revenue),
    fuelCost: round(fuelCost),
    otherExpensesCost: round(otherExpensesCost),
    totalCost: round(totalCost),
    margin: round(margin),
    currency,
  };
}
