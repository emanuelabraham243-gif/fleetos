import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

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
