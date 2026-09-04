"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { getExpenseById } from "@/lib/data/expenses";
import { getCurrentProfile } from "@/lib/data/profile";
import { canReviewExpense } from "@/lib/domain/expense";
import { canManageFleet } from "@/lib/domain/permissions";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

async function uploadReceipt(
  supabase: Supabase,
  params: { organizationId: string; expenseId: string; file: File },
): Promise<{ path: string } | { error: string }> {
  const path = `${params.organizationId}/expenses/${params.expenseId}/${Date.now()}-${params.file.name}`;
  const { error } = await supabase.storage
    .from("attachments")
    .upload(path, params.file, { contentType: params.file.type || undefined });
  if (error) {
    return { error: `Expense recorded, but the receipt failed to upload: ${error.message}` };
  }
  return { path };
}

export type CreateExpenseState = { error: string } | null;

/** Add Expense. Every expense starts RECORDED -- approval is a separate, explicit step (see reviewExpense), never implied by who entered it. */
export async function createExpense(
  _prevState: CreateExpenseState,
  formData: FormData,
): Promise<CreateExpenseState> {
  const profile = await getCurrentProfile();
  if (!profile || !canManageFleet(profile.role)) {
    return { error: "You don't have permission to record expenses." };
  }

  const occurredAtRaw = String(formData.get("occurred_at") ?? "").trim();
  if (!occurredAtRaw) return { error: "A date is required." };
  const occurredAt = new Date(occurredAtRaw);
  if (Number.isNaN(occurredAt.getTime())) return { error: "Date is not valid." };

  const category = String(formData.get("category") ?? "").trim();
  if (!category) return { error: "A category is required." };

  const amount = Number(formData.get("amount"));
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Amount must be a positive number." };
  }

  const description = String(formData.get("description") ?? "").trim();
  if (!description) return { error: "A description is required." };

  const supabase = await createClient();

  const vehicleId = String(formData.get("vehicle_id") ?? "").trim() || null;
  const driverId = String(formData.get("driver_id") ?? "").trim() || null;
  const tripId = String(formData.get("trip_id") ?? "").trim() || null;
  const vendorId = String(formData.get("vendor_id") ?? "").trim() || null;
  const paymentMethod = String(formData.get("payment_method") ?? "").trim() || null;

  const insertValues: Database["public"]["Tables"]["expenses"]["Insert"] = {
    organization_id: profile.organization_id,
    occurred_at: occurredAt.toISOString(),
    category: category as Database["public"]["Enums"]["expense_category"],
    amount,
    description,
    vehicle_id: vehicleId,
    driver_id: driverId,
    trip_id: tripId,
    vendor_id: vendorId,
    vendor_name: String(formData.get("vendor_name") ?? "").trim() || null,
    payment_method: paymentMethod as Database["public"]["Enums"]["payment_method"] | null,
    reference_number: String(formData.get("reference_number") ?? "").trim() || null,
    created_by: profile.id,
  };

  const { data, error } = await supabase.from("expenses").insert(insertValues).select("id").single();

  if (error) return { error: error.message };

  const receiptFile = formData.get("receipt");
  if (receiptFile instanceof File && receiptFile.size > 0) {
    const uploadResult = await uploadReceipt(supabase, {
      organizationId: profile.organization_id,
      expenseId: data.id,
      file: receiptFile,
    });
    if ("error" in uploadResult) return { error: uploadResult.error };

    const { error: updateError } = await supabase
      .from("expenses")
      .update({ receipt_url: uploadResult.path })
      .eq("id", data.id);
    if (updateError) {
      return { error: `Expense recorded, but the receipt failed to save: ${updateError.message}` };
    }
  }

  revalidatePath("/finance/expenses");
  if (vehicleId) revalidatePath(`/vehicles/${vehicleId}`);
  if (tripId) revalidatePath(`/trips/${tripId}`);
  redirect("/finance/expenses");
}

export type ReviewExpenseState = { error: string } | { success: true } | null;

/**
 * Approve or reject a PENDING_REVIEW/RECORDED expense. This is the only
 * place approval_status is ever written from the app, so `canReviewExpense`
 * is checked exactly once regardless of which screen triggered it.
 */
export async function reviewExpense(
  _prevState: ReviewExpenseState,
  formData: FormData,
): Promise<ReviewExpenseState> {
  const profile = await getCurrentProfile();
  if (!profile || !canManageFleet(profile.role)) {
    return { error: "You don't have permission to review expenses." };
  }

  const expenseId = String(formData.get("expense_id") ?? "").trim();
  const decision = String(formData.get("decision") ?? "").trim();
  if (!expenseId || (decision !== "APPROVED" && decision !== "REJECTED")) {
    return { error: "Missing expense or decision." };
  }

  const rejectionReason = String(formData.get("rejection_reason") ?? "").trim();
  if (decision === "REJECTED" && !rejectionReason) {
    return { error: "A reason is required to reject an expense." };
  }

  const supabase = await createClient();
  const expense = await getExpenseById(supabase, expenseId);
  if (!expense) return { error: "Expense not found." };
  if (!canReviewExpense(expense.approval_status)) {
    return { error: `This expense is already ${expense.approval_status.toLowerCase().replace("_", " ")}.` };
  }

  const { error } = await supabase
    .from("expenses")
    .update({
      approval_status: decision,
      approved_by: profile.id,
      approved_at: new Date().toISOString(),
      rejection_reason: decision === "REJECTED" ? rejectionReason : null,
    })
    .eq("id", expenseId);
  if (error) return { error: error.message };

  revalidatePath("/finance/expenses");
  return { success: true };
}

export type VoidExpenseState = { error: string } | { success: true } | null;

/** Expenses are never hard-deleted -- voiding keeps the row with a reason, excluded from totals by `status`. */
export async function voidExpense(
  _prevState: VoidExpenseState,
  formData: FormData,
): Promise<VoidExpenseState> {
  const profile = await getCurrentProfile();
  if (!profile || !canManageFleet(profile.role)) {
    return { error: "You don't have permission to void expenses." };
  }

  const expenseId = String(formData.get("expense_id") ?? "").trim();
  const reason = String(formData.get("void_reason") ?? "").trim();
  if (!expenseId) return { error: "Missing expense." };
  if (!reason) return { error: "A reason is required to void an expense." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("expenses")
    .update({ status: "voided", void_reason: reason })
    .eq("id", expenseId);
  if (error) return { error: error.message };

  revalidatePath("/finance/expenses");
  return { success: true };
}
