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
