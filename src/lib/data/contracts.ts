import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

export type Contract = Database["public"]["Tables"]["contracts"]["Row"];

/** Reusable read pattern for the contract roster, scoped by RLS to the caller's organization -- mirrors getClients. Used by the Record Revenue form's dropdown. */
export async function getContracts(supabase: SupabaseClient<Database>): Promise<Contract[]> {
  const { data, error } = await supabase.from("contracts").select("*").order("contract_number");

  if (error) {
    throw new Error(`Failed to load contracts: ${error.message}`);
  }

  return data;
}

const CONTRACT_LIST_SELECT = "*, client:clients(id, name)";

export type ContractListItem = Contract & {
  client: Pick<Database["public"]["Tables"]["clients"]["Row"], "id" | "name">;
};

/** The `/compliance/contracts` list -- every contract in the caller's org, newest first. */
export async function getContractsList(supabase: SupabaseClient<Database>): Promise<ContractListItem[]> {
  const { data, error } = await supabase
    .from("contracts")
    .select(CONTRACT_LIST_SELECT)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load contracts: ${error.message}`);
  }
  return data;
}

/** Single-contract read used by the status-transition action to check current state before writing. */
export async function getContractById(
  supabase: SupabaseClient<Database>,
  contractId: string,
): Promise<Contract | null> {
  const { data, error } = await supabase.from("contracts").select("*").eq("id", contractId).maybeSingle();
  if (error) {
    throw new Error(`Failed to load contract: ${error.message}`);
  }
  return data;
}
