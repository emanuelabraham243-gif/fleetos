import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

export type Vendor = Database["public"]["Tables"]["vendors"]["Row"];

/** Every vendor in the caller's organization, alphabetical -- reused by both the fuel-station and expense-vendor pickers rather than duplicated per form. */
export async function getVendors(supabase: SupabaseClient<Database>): Promise<Vendor[]> {
  const { data, error } = await supabase
    .from("vendors")
    .select("*")
    .is("archived_at", null)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to load vendors: ${error.message}`);
  }
  return data;
}
