import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

export type VehicleIncident = Database["public"]["Tables"]["incidents"]["Row"] & {
  driver: Pick<Database["public"]["Tables"]["drivers"]["Row"], "id" | "full_name"> | null;
  trip: Pick<Database["public"]["Tables"]["trips"]["Row"], "id" | "trip_number"> | null;
  evidence: Database["public"]["Tables"]["incident_evidence"]["Row"][];
};

export async function getVehicleIncidents(
  supabase: SupabaseClient<Database>,
  vehicleId: string,
): Promise<VehicleIncident[]> {
  const { data, error } = await supabase
    .from("incidents")
    .select(
      "*, driver:drivers(id, full_name), trip:trips(id, trip_number), evidence:incident_evidence(*)",
    )
    .eq("vehicle_id", vehicleId)
    .order("occurred_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load incidents: ${error.message}`);
  }

  return data;
}
