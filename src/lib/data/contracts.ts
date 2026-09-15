import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

export type Contract = Database["public"]["Tables"]["contracts"]["Row"];

/** Reusable read pattern for the contract roster, scoped by RLS to the caller's organization -- mirrors getClients. */
export async function getContracts(supabase: SupabaseClient<Database>): Promise<Contract[]> {
  const { data, error } = await supabase.from("contracts").select("*").order("contract_number");

  if (error) {
    throw new Error(`Failed to load contracts: ${error.message}`);
  }

  return data;
}
