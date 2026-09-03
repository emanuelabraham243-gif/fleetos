import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

export type DriverDispute = Database["public"]["Tables"]["disputes"]["Row"] & {
  trip: Pick<Database["public"]["Tables"]["trips"]["Row"], "id" | "trip_number"> | null;
  delivery: Pick<Database["public"]["Tables"]["deliveries"]["Row"], "id" | "delivery_number"> | null;
  vehicle: Pick<Database["public"]["Tables"]["vehicles"]["Row"], "id" | "unit_number"> | null;
  client: Pick<Database["public"]["Tables"]["clients"]["Row"], "id" | "name"> | null;
};

const DRIVER_DISPUTE_SELECT =
  "*, trip:trips(id, trip_number), delivery:deliveries(id, delivery_number), vehicle:vehicles(id, unit_number), client:clients(id, name)";

/**
 * Every dispute that names this driver -- reuses the existing disputes
 * table (Phase 1) rather than a separate driver-issue system. Both sides
 * of the record are preserved on the same row: `description`/`resolution`
 * are whoever raised and resolved the dispute, `driver_response` is the
 * driver's own account, and neither is ever silently cleared by the other.
 */
export async function getDriverDisputes(
  supabase: SupabaseClient<Database>,
  driverId: string,
): Promise<DriverDispute[]> {
  const { data, error } = await supabase
    .from("disputes")
    .select(DRIVER_DISPUTE_SELECT)
    .eq("driver_id", driverId)
    .order("opened_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load driver disputes: ${error.message}`);
  }

  return data;
}
