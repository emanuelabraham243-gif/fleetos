import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

export type VehicleDocument = Database["public"]["Tables"]["vehicle_documents"]["Row"];

export async function getVehicleDocuments(
  supabase: SupabaseClient<Database>,
  vehicleId: string,
): Promise<VehicleDocument[]> {
  const { data, error } = await supabase
    .from("vehicle_documents")
    .select("*")
    .eq("vehicle_id", vehicleId)
    .order("expires_at", { ascending: true, nullsFirst: false });

  if (error) {
    throw new Error(`Failed to load vehicle documents: ${error.message}`);
  }

  return data;
}
