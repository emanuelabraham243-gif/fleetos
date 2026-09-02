import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

export type GpsEvent = Database["public"]["Tables"]["gps_events"]["Row"];

/** Recent raw fixes for one vehicle, newest first -- the Live Tracking tab's timeline. */
export async function getRecentGpsEvents(
  supabase: SupabaseClient<Database>,
  vehicleId: string,
  limit = 10,
): Promise<GpsEvent[]> {
  const { data, error } = await supabase
    .from("gps_events")
    .select("*")
    .eq("vehicle_id", vehicleId)
    .order("recorded_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to load GPS history: ${error.message}`);
  }

  return data;
}
