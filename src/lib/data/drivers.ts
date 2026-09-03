import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

export type Driver = Database["public"]["Tables"]["drivers"]["Row"];

/** Reusable read pattern for the driver roster, scoped by RLS to the caller's organization. */
export async function getDrivers(supabase: SupabaseClient<Database>): Promise<Driver[]> {
  const { data, error } = await supabase
    .from("drivers")
    .select("*")
    .is("archived_at", null)
    .order("full_name");

  if (error) {
    throw new Error(`Failed to load drivers: ${error.message}`);
  }

  return data;
}

/** Single-driver read for the Driver Detail page. Returns null if not found (or not in the caller's org, via RLS). */
export async function getDriverById(
  supabase: SupabaseClient<Database>,
  driverId: string,
): Promise<Driver | null> {
  const { data, error } = await supabase
    .from("drivers")
    .select("*")
    .eq("id", driverId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load driver: ${error.message}`);
  }
  return data;
}
