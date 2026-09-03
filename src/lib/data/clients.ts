import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

export type Client = Database["public"]["Tables"]["clients"]["Row"];

/** Reusable read pattern for the client roster, scoped by RLS to the caller's organization. */
export async function getClients(supabase: SupabaseClient<Database>): Promise<Client[]> {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .is("archived_at", null)
    .order("name");

  if (error) {
    throw new Error(`Failed to load clients: ${error.message}`);
  }

  return data;
}
