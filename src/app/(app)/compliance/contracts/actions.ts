"use server";

import { revalidatePath } from "next/cache";

import { getContractById } from "@/lib/data/contracts";
import { getCurrentProfile } from "@/lib/data/profile";
import { canTransitionContract, type ContractStatus } from "@/lib/domain/contract";
import { canManageFleet } from "@/lib/domain/permissions";
import { CONTRACT_STATUS_LABEL } from "@/lib/i18n/labels";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

async function nextContractNumber(supabase: Awaited<ReturnType<typeof createClient>>): Promise<string> {
  const { count, error } = await supabase.from("contracts").select("id", { count: "exact", head: true });
  if (error) {
    throw new Error(`Failed to determine next contract number: ${error.message}`);
  }
  return `CNT-${String((count ?? 0) + 1).padStart(3, "0")}`;
}

export type CreateContractState = { error: string } | { success: true } | null;

/** Create Contract -- always starts DRAFT; the contract number is server-generated, mirroring TR-XXX/INV-XXX. */
export async function createContract(_prevState: CreateContractState, formData: FormData): Promise<CreateContractState> {
  const profile = await getCurrentProfile();
  if (!profile || !canManageFleet(profile.role)) {
    return { error: "You don't have permission to create contracts." };
  }

  const clientId = String(formData.get("client_id") ?? "").trim();
  if (!clientId) return { error: "A client is required." };

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "A title is required." };

  const rateType = String(formData.get("rate_type") ?? "flat").trim();
  const rateAmountRaw = String(formData.get("rate_amount") ?? "").trim();
  const rateAmount = rateAmountRaw ? Number(rateAmountRaw) : null;
  if (rateAmount !== null && (!Number.isFinite(rateAmount) || rateAmount < 0)) {
    return { error: "Rate amount must be a non-negative number." };
  }

  const startDate = String(formData.get("start_date") ?? "").trim() || null;
  const endDate = String(formData.get("end_date") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  const supabase = await createClient();
  const contractNumber = await nextContractNumber(supabase);

  const insertValues: Database["public"]["Tables"]["contracts"]["Insert"] = {
    organization_id: profile.organization_id,
    client_id: clientId,
    contract_number: contractNumber,
    title,
    rate_type: rateType as Database["public"]["Enums"]["contract_rate_type"],
    rate_amount: rateAmount,
    status: "draft",
    start_date: startDate,
    end_date: endDate,
    notes,
  };

  const { error } = await supabase.from("contracts").insert(insertValues);
  if (error) return { error: error.message };

  revalidatePath("/compliance/contracts");
  return { success: true };
}

export type ContractStatusState = { error: string } | { success: true } | null;

/** Any status transition `canTransitionContract` allows -- expired/terminated are terminal, never reopened. */
export async function transitionContractStatus(
  _prevState: ContractStatusState,
  formData: FormData,
): Promise<ContractStatusState> {
  const profile = await getCurrentProfile();
  if (!profile || !canManageFleet(profile.role)) {
    return { error: "You don't have permission to change contract status." };
  }

  const contractId = String(formData.get("contract_id") ?? "").trim();
  const toStatus = String(formData.get("to_status") ?? "").trim() as ContractStatus;
  if (!contractId || !toStatus) return { error: "Missing contract or target status." };

  const supabase = await createClient();
  const contract = await getContractById(supabase, contractId);
  if (!contract) return { error: "Contract not found." };

  if (!canTransitionContract(contract.status, toStatus)) {
    return {
      error: `Cannot move a contract from ${CONTRACT_STATUS_LABEL[contract.status]} to ${CONTRACT_STATUS_LABEL[toStatus]}.`,
    };
  }

  const { error } = await supabase.from("contracts").update({ status: toStatus }).eq("id", contractId);
  if (error) return { error: error.message };

  revalidatePath("/compliance/contracts");
  return { success: true };
}
