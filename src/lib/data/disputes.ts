import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

const DISPUTE_LIST_SELECT =
  "*, trip:trips(id, trip_number), delivery:deliveries(id, delivery_number), vehicle:vehicles(id, unit_number), driver:drivers(id, full_name), client:clients(id, name), incident:incidents(id, incident_type)";

export type DisputeListItem = Database["public"]["Tables"]["disputes"]["Row"] & {
  trip: Pick<Database["public"]["Tables"]["trips"]["Row"], "id" | "trip_number"> | null;
  delivery: Pick<Database["public"]["Tables"]["deliveries"]["Row"], "id" | "delivery_number"> | null;
  vehicle: Pick<Database["public"]["Tables"]["vehicles"]["Row"], "id" | "unit_number"> | null;
  driver: Pick<Database["public"]["Tables"]["drivers"]["Row"], "id" | "full_name"> | null;
  client: Pick<Database["public"]["Tables"]["clients"]["Row"], "id" | "name"> | null;
  incident: Pick<Database["public"]["Tables"]["incidents"]["Row"], "id" | "incident_type"> | null;
};

/** Every dispute in the caller's org, newest first -- the fleet-wide view `getDriverDisputes` doesn't provide. */
export async function getDisputesList(supabase: SupabaseClient<Database>): Promise<DisputeListItem[]> {
  const { data, error } = await supabase
    .from("disputes")
    .select(DISPUTE_LIST_SELECT)
    .order("opened_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load disputes: ${error.message}`);
  }
  return data;
}

export async function getDisputeById(
  supabase: SupabaseClient<Database>,
  disputeId: string,
): Promise<DisputeListItem | null> {
  const { data, error } = await supabase
    .from("disputes")
    .select(DISPUTE_LIST_SELECT)
    .eq("id", disputeId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load dispute: ${error.message}`);
  }
  return data;
}
