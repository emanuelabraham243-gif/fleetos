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

export type DriverIncident = Database["public"]["Tables"]["incidents"]["Row"] & {
  vehicle: Pick<Database["public"]["Tables"]["vehicles"]["Row"], "id" | "unit_number"> | null;
  trip: Pick<Database["public"]["Tables"]["trips"]["Row"], "id" | "trip_number"> | null;
  evidence: Database["public"]["Tables"]["incident_evidence"]["Row"][];
};

/** Every incident recorded against one driver -- the occurrence is a fact this just reads; whether anyone is at fault is never inferred here, only ever recorded explicitly by a user (via a linked dispute's own resolution). */
export async function getDriverIncidents(
  supabase: SupabaseClient<Database>,
  driverId: string,
): Promise<DriverIncident[]> {
  const { data, error } = await supabase
    .from("incidents")
    .select(
      "*, vehicle:vehicles(id, unit_number), trip:trips(id, trip_number), evidence:incident_evidence(*)",
    )
    .eq("driver_id", driverId)
    .order("occurred_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load driver incidents: ${error.message}`);
  }

  return data;
}
