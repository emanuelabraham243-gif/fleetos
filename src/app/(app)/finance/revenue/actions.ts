"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { getCurrentProfile } from "@/lib/data/profile";
import { canManageFleet } from "@/lib/domain/permissions";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type CreateRevenueState = { error: string } | null;

/** Record Revenue -- money actually earned (a trip, a contract, or ad-hoc), never a projection or an invoice's face value. */
export async function createRevenue(
  _prevState: CreateRevenueState,
  formData: FormData,
): Promise<CreateRevenueState> {
  const profile = await getCurrentProfile();
  if (!profile || !canManageFleet(profile.role)) {
    return { error: "You don't have permission to record revenue." };
  }

  const occurredAtRaw = String(formData.get("occurred_at") ?? "").trim();
  if (!occurredAtRaw) return { error: "A date is required." };
  const occurredAt = new Date(occurredAtRaw);
  if (Number.isNaN(occurredAt.getTime())) return { error: "Date is not valid." };

  const amount = Number(formData.get("amount"));
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Amount must be a positive number." };
  }

  const description = String(formData.get("description") ?? "").trim();
  if (!description) return { error: "A description is required." };

  const clientId = String(formData.get("client_id") ?? "").trim() || null;
  const contractId = String(formData.get("contract_id") ?? "").trim() || null;
  const tripId = String(formData.get("trip_id") ?? "").trim() || null;
  const currency = String(formData.get("currency") ?? "ETB").trim() || "ETB";
  const returnTo = String(formData.get("return_to") ?? "").trim();

  const supabase = await createClient();

  const insertValues: Database["public"]["Tables"]["revenues"]["Insert"] = {
    organization_id: profile.organization_id,
    occurred_at: occurredAt.toISOString(),
    amount,
    currency,
    description,
    client_id: clientId,
    contract_id: contractId,
    trip_id: tripId,
    created_by: profile.id,
  };

  const { error } = await supabase.from("revenues").insert(insertValues);
  if (error) return { error: error.message };

  revalidatePath("/finance/revenue");
  if (tripId) revalidatePath(`/trips/${tripId}`);
  redirect(returnTo.startsWith("/") ? returnTo : "/finance/revenue");
}

export type VoidRevenueState = { error: string } | { success: true } | null;

/** Revenue rows are never hard-deleted -- voiding keeps the row with a reason, excluded from totals by status. Same stamp-onto-description pattern as voiding a fuel transaction (`revenues` has no dedicated void_reason column). */
export async function voidRevenue(_prevState: VoidRevenueState, formData: FormData): Promise<VoidRevenueState> {
  const profile = await getCurrentProfile();
  if (!profile || !canManageFleet(profile.role)) {
    return { error: "You don't have permission to void revenue." };
  }

  const revenueId = String(formData.get("revenue_id") ?? "").trim();
  const reason = String(formData.get("void_reason") ?? "").trim();
  if (!revenueId) return { error: "Missing revenue record." };
  if (!reason) return { error: "A reason is required to void a revenue record." };

  const supabase = await createClient();
  const stamp = `[Voided ${new Date().toISOString()}] ${reason}`;

  const { data: existing, error: fetchError } = await supabase
    .from("revenues")
    .select("description")
    .eq("id", revenueId)
    .maybeSingle();
  if (fetchError) return { error: fetchError.message };
  if (!existing) return { error: "Revenue record not found." };

  const { error } = await supabase
    .from("revenues")
    .update({ status: "voided", description: existing.description ? `${existing.description}\n${stamp}` : stamp })
    .eq("id", revenueId);
  if (error) return { error: error.message };

  revalidatePath("/finance/revenue");
  return { success: true };
}
