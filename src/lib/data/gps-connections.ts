import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

const GPS_CONNECTION_SELECT = "*, gps_provider:gps_providers(id, name, slug), vehicle_devices(id, is_active)";

export type GpsConnectionListItem = Database["public"]["Tables"]["gps_connections"]["Row"] & {
  gps_provider: Pick<Database["public"]["Tables"]["gps_providers"]["Row"], "id" | "name" | "slug"> | null;
  vehicle_devices: Pick<Database["public"]["Tables"]["vehicle_devices"]["Row"], "id" | "is_active">[];
};

/** Every GPS connection in the caller's org, with its provider and device count -- the `/system/integrations` list. */
export async function getGpsConnectionsList(supabase: SupabaseClient<Database>): Promise<GpsConnectionListItem[]> {
  const { data, error } = await supabase
    .from("gps_connections")
    .select(GPS_CONNECTION_SELECT)
    .order("name");

  if (error) {
    throw new Error(`Failed to load GPS connections: ${error.message}`);
  }
  return data;
}
