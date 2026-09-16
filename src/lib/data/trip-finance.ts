import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { EXPENSE_CATEGORY_LABEL } from "@/lib/i18n/labels";
import type { Database } from "@/lib/supabase/database.types";

export interface TripFinancialLineItem {
  id: string;
  occurredAt: string;
  description: string;
  amount: number;
  currency: string;
}

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
  revenueItems: TripFinancialLineItem[];
  fuelItems: TripFinancialLineItem[];
  expenseItems: TripFinancialLineItem[];
}

const DEFAULT_CURRENCY = "ETB";

/**
 * Fuel and expenses are now directly trip-attributed (fuel_transactions.trip_id,
 * expenses.trip_id, added in Phase 6) rather than correlated by time window --
 * a real foreign key, so "Trip: Unassigned" fuel/expenses never leak into a
 * trip's cost just because they happened during its window. Revenue was
 * already trip-attributed (revenues.trip_id) since Phase 4.
 *
 * Totals are derived from the same mapped line-item arrays the itemized
 * view renders, rather than a second raw-row sum -- one source of truth
 * for "what's in this trip's P&L" instead of two computations that could drift.
 */
export async function getTripFinancialSummary(
  supabase: SupabaseClient<Database>,
  tripId: string,
): Promise<TripFinancialSummary> {
  const [revenueRes, fuelRes, expensesRes] = await Promise.all([
    supabase
      .from("revenues")
      .select("id, occurred_at, description, amount, currency")
      .eq("status", "active")
      .eq("trip_id", tripId),
    supabase
      .from("fuel_transactions")
      .select("id, occurred_at, volume_liters, vendor_name, total_amount, currency")
      .eq("status", "active")
      .eq("trip_id", tripId),
    supabase
      .from("expenses")
      .select("id, occurred_at, description, category, amount, currency")
      .eq("status", "active")
      .eq("trip_id", tripId),
  ]);

  if (revenueRes.error) throw new Error(`Failed to load trip revenue: ${revenueRes.error.message}`);
  if (fuelRes.error) throw new Error(`Failed to load trip fuel cost: ${fuelRes.error.message}`);
  if (expensesRes.error) throw new Error(`Failed to load trip expenses: ${expensesRes.error.message}`);

  const currency =
    revenueRes.data?.[0]?.currency ?? fuelRes.data?.[0]?.currency ?? expensesRes.data?.[0]?.currency ?? DEFAULT_CURRENCY;

  const round = (value: number | null) => (value === null ? null : Math.round(value * 100) / 100);
  const sumItems = (items: TripFinancialLineItem[]) => (items.length === 0 ? null : items.reduce((total, item) => total + item.amount, 0));

  const revenueItems: TripFinancialLineItem[] = (revenueRes.data ?? []).map((row) => ({
    id: row.id,
    occurredAt: row.occurred_at,
    description: row.description ?? "Revenue",
    amount: Number(row.amount),
    currency: row.currency,
  }));

  const fuelItems: TripFinancialLineItem[] = (fuelRes.data ?? []).map((row) => ({
    id: row.id,
    occurredAt: row.occurred_at,
    description: `${Number(row.volume_liters)} L${row.vendor_name ? ` at ${row.vendor_name}` : ""}`,
    amount: Number(row.total_amount),
    currency: row.currency,
  }));

  const expenseItems: TripFinancialLineItem[] = (expensesRes.data ?? []).map((row) => ({
    id: row.id,
    occurredAt: row.occurred_at,
    description: row.description || EXPENSE_CATEGORY_LABEL[row.category],
    amount: Number(row.amount),
    currency: row.currency,
  }));

  const revenue = sumItems(revenueItems);
  const fuelCost = sumItems(fuelItems);
  const otherExpensesCost = sumItems(expenseItems);

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
    revenueItems,
    fuelItems,
    expenseItems,
  };
}
