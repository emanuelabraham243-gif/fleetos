import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { ACTIVE_TRIP_STATUSES } from "@/lib/domain/trip";
import type { Database } from "@/lib/supabase/database.types";

export type ActiveTrip = Database["public"]["Tables"]["trips"]["Row"] & {
  vehicle: Pick<Database["public"]["Tables"]["vehicles"]["Row"], "id" | "unit_number"> | null;
  driver: Pick<Database["public"]["Tables"]["drivers"]["Row"], "id" | "full_name"> | null;
};

/**
 * Every trip currently in progress (ASSIGNED through ARRIVED -- see
 * ACTIVE_TRIP_STATUSES), with its vehicle and driver attached. This is the
 * single query both the Active Trips section and the fleet board's
 * per-vehicle "current trip" lookup read from -- neither re-queries trips
 * on its own.
 */
export async function getActiveTrips(
  supabase: SupabaseClient<Database>,
): Promise<ActiveTrip[]> {
  const { data, error } = await supabase
    .from("trips")
    .select("*, vehicle:vehicles(id, unit_number), driver:drivers(id, full_name)")
    .in("status", ACTIVE_TRIP_STATUSES)
    .order("actual_start", { ascending: false, nullsFirst: false });

  if (error) {
    throw new Error(`Failed to load active trips: ${error.message}`);
  }

  return data;
}
