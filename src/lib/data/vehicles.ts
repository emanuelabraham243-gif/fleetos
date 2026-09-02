import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

export type VehicleWithLocation =
  Database["public"]["Tables"]["vehicles"]["Row"] & {
    vehicle_locations: Database["public"]["Tables"]["vehicle_locations"]["Row"] | null;
  };

/**
 * Reusable read pattern for the fleet list: every vehicle in the caller's
 * organization (RLS enforces that scoping -- this never takes an
 * organization id as a parameter) plus its latest known GPS fix, if any.
 */
export async function getVehicles(
  supabase: SupabaseClient<Database>,
): Promise<VehicleWithLocation[]> {
  const { data, error } = await supabase
    .from("vehicles")
    .select("*, vehicle_locations(*)")
    .is("archived_at", null)
    .order("unit_number");

  if (error) {
    throw new Error(`Failed to load vehicles: ${error.message}`);
  }

  return data;
}
