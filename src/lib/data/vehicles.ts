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

/** Single-vehicle read for the vehicle detail page. Returns null if not found (or not in the caller's org, via RLS). */
export async function getVehicleById(
  supabase: SupabaseClient<Database>,
  vehicleId: string,
): Promise<VehicleWithLocation | null> {
  const { data, error } = await supabase
    .from("vehicles")
    .select("*, vehicle_locations(*)")
    .eq("id", vehicleId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load vehicle: ${error.message}`);
  }

  return data;
}

export type VehicleTrip = Database["public"]["Tables"]["trips"]["Row"] & {
  driver: Pick<Database["public"]["Tables"]["drivers"]["Row"], "id" | "full_name"> | null;
};

/** Most recent trips for one vehicle (active or not), newest first. */
export async function getVehicleTrips(
  supabase: SupabaseClient<Database>,
  vehicleId: string,
  limit = 10,
): Promise<VehicleTrip[]> {
  const { data, error } = await supabase
    .from("trips")
    .select("*, driver:drivers(id, full_name)")
    .eq("vehicle_id", vehicleId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to load vehicle trips: ${error.message}`);
  }

  return data;
}
