import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { DateRange } from "@/lib/domain/date-range";
import type { Database } from "@/lib/supabase/database.types";

/** Total active revenue per trip id, for trips that have any. Trips with none are simply absent from the map. */
export async function getRevenueByTripIds(
  supabase: SupabaseClient<Database>,
  tripIds: string[],
): Promise<Map<string, { amount: number; currency: string }>> {
  if (tripIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from("revenues")
    .select("trip_id, amount, currency")
    .eq("status", "active")
    .in("trip_id", tripIds);

  if (error) {
    throw new Error(`Failed to load trip revenue: ${error.message}`);
  }

  const byTrip = new Map<string, { amount: number; currency: string }>();
  for (const row of data ?? []) {
    if (!row.trip_id) continue;
    const existing = byTrip.get(row.trip_id);
    byTrip.set(row.trip_id, {
      amount: (existing?.amount ?? 0) + Number(row.amount),
      currency: row.currency,
    });
  }
  return byTrip;
}

// ============================================================================
// /finance/revenue page: list, summary, and void support. `getRevenueByTripIds`
// above is unchanged so Trip Detail/Vehicle Detail keep working as they did.
// ============================================================================

const REVENUE_LIST_SELECT =
  "*, client:clients(id, name), contract:contracts(id, contract_number, title), trip:trips(id, trip_number), recorded_by_profile:profiles!revenues_created_by_fkey(id, full_name)";

export type RevenueListItem = Database["public"]["Tables"]["revenues"]["Row"] & {
  client: Pick<Database["public"]["Tables"]["clients"]["Row"], "id" | "name"> | null;
  contract: Pick<Database["public"]["Tables"]["contracts"]["Row"], "id" | "contract_number" | "title"> | null;
  trip: Pick<Database["public"]["Tables"]["trips"]["Row"], "id" | "trip_number"> | null;
  recorded_by_profile: Pick<Database["public"]["Tables"]["profiles"]["Row"], "id" | "full_name"> | null;
};

export interface RevenueListFilters {
  dateRange: DateRange;
  clientId?: string;
  /** Matches against description (case-insensitive). */
  search?: string;
}

function applyRevenueFilters<
  T extends {
    eq: (column: string, value: string) => T;
    gte: (column: string, value: string) => T;
    lt: (column: string, value: string) => T;
    ilike: (column: string, value: string) => T;
  },
>(query: T, filters: RevenueListFilters): T {
  let q: T = query
    .eq("status", "active")
    .gte("occurred_at", filters.dateRange.startIso)
    .lt("occurred_at", filters.dateRange.endIso);
  if (filters.clientId) q = q.eq("client_id", filters.clientId);
  if (filters.search) {
    const term = filters.search.trim();
    if (term.length > 0) {
      const escaped = term.replace(/[%_]/g, (c) => `\\${c}`);
      q = q.ilike("description", `%${escaped}%`);
    }
  }
  return q;
}

/** The `/finance/revenue` list query -- every active revenue row in the caller's org within the filtered range, newest first. */
export async function getRevenueList(
  supabase: SupabaseClient<Database>,
  filters: RevenueListFilters,
): Promise<RevenueListItem[]> {
  const query = applyRevenueFilters(supabase.from("revenues").select(REVENUE_LIST_SELECT), filters).order(
    "occurred_at",
    { ascending: false },
  );

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to load revenue: ${error.message}`);
  }
  return data;
}

export interface RevenueSummary {
  transactionCount: number;
  totalAmount: number | null;
  currency: string;
}

/** Summary cards for `/finance/revenue` -- same filters as the list, so the cards and table always agree on what's in view. */
export async function getRevenueSummary(
  supabase: SupabaseClient<Database>,
  filters: RevenueListFilters,
): Promise<RevenueSummary> {
  const { data, error } = await applyRevenueFilters(
    supabase.from("revenues").select("amount, currency"),
    filters,
  );
  if (error) {
    throw new Error(`Failed to load revenue summary: ${error.message}`);
  }

  const rows = data ?? [];
  const totalAmount = rows.length > 0 ? rows.reduce((sum, r) => sum + Number(r.amount), 0) : null;

  return {
    transactionCount: rows.length,
    totalAmount: totalAmount !== null ? Math.round(totalAmount * 100) / 100 : null,
    currency: rows[0]?.currency ?? "ETB",
  };
}

/** Single-revenue read used by the void action to check current state before writing. */
export async function getRevenueById(
  supabase: SupabaseClient<Database>,
  revenueId: string,
): Promise<Database["public"]["Tables"]["revenues"]["Row"] | null> {
  const { data, error } = await supabase.from("revenues").select("*").eq("id", revenueId).maybeSingle();
  if (error) {
    throw new Error(`Failed to load revenue: ${error.message}`);
  }
  return data;
}
