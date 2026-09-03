import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

export type TripStop = Database["public"]["Tables"]["trip_stops"]["Row"];

/** Every stop on one trip, in route order -- the Trip Detail stops section reads this directly. */
export async function getTripStops(
  supabase: SupabaseClient<Database>,
  tripId: string,
): Promise<TripStop[]> {
  const { data, error } = await supabase
    .from("trip_stops")
    .select("*")
    .eq("trip_id", tripId)
    .order("sequence");

  if (error) {
    throw new Error(`Failed to load trip stops: ${error.message}`);
  }
  return data;
}
