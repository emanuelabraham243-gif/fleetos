import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

export type DriverAssignment = Database["public"]["Tables"]["vehicle_driver_assignments"]["Row"] & {
  driver: Pick<Database["public"]["Tables"]["drivers"]["Row"], "id" | "full_name"> | null;
  assigned_by_profile: Pick<Database["public"]["Tables"]["profiles"]["Row"], "id" | "full_name"> | null;
};

/** The open (unassigned_at is null) assignment for every vehicle, keyed by vehicle id. */
export async function getCurrentAssignmentsByVehicle(
  supabase: SupabaseClient<Database>,
): Promise<Map<string, DriverAssignment>> {
  const { data, error } = await supabase
    .from("vehicle_driver_assignments")
    .select("*, driver:drivers(id, full_name), assigned_by_profile:profiles(id, full_name)")
    .is("unassigned_at", null);

  if (error) {
    throw new Error(`Failed to load driver assignments: ${error.message}`);
  }

  return new Map((data ?? []).map((assignment) => [assignment.vehicle_id, assignment]));
}

/** Full assignment history for one vehicle, newest first -- nothing here is ever deleted, only closed out. */
export async function getVehicleAssignmentHistory(
  supabase: SupabaseClient<Database>,
  vehicleId: string,
): Promise<DriverAssignment[]> {
  const { data, error } = await supabase
    .from("vehicle_driver_assignments")
    .select("*, driver:drivers(id, full_name), assigned_by_profile:profiles(id, full_name)")
    .eq("vehicle_id", vehicleId)
    .order("assigned_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load assignment history: ${error.message}`);
  }

  return data;
}
