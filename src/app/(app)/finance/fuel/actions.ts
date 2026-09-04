"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { getCurrentProfile } from "@/lib/data/profile";
import { getVehicleOdometerProvenance } from "@/lib/data/fuel";
import { canManageFleet } from "@/lib/domain/permissions";
import { validateOdometerReading } from "@/lib/domain/odometer-provenance";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

async function uploadReceipt(
  supabase: Supabase,
  params: { organizationId: string; transactionId: string; file: File },
): Promise<{ path: string } | { error: string }> {
  const path = `${params.organizationId}/fuel/${params.transactionId}/${Date.now()}-${params.file.name}`;
  const { error } = await supabase.storage
    .from("attachments")
    .upload(path, params.file, { contentType: params.file.type || undefined });
  if (error) {
    return { error: `Fuel transaction recorded, but the receipt failed to upload: ${error.message}` };
  }
  return { path };
}

export type CreateFuelTransactionState = { error: string } | null;

/**
 * Record Fuel. Total amount is always liters * price -- never accepted as
 * a submitted field, so it can't drift from the two numbers that produced
 * it. The odometer is checked against the last known reading from any
 * source (lib/data/fuel.ts's `getVehicleOdometerProvenance`) before the
 * insert; a lower reading is rejected unless the submitter gives a reason,
 * which is stored on the row (the existing audit trigger on
 * fuel_transactions already records every insert/update, so the override
 * reason is part of that trail, not a separate mechanism).
 */
export async function createFuelTransaction(
  _prevState: CreateFuelTransactionState,
  formData: FormData,
): Promise<CreateFuelTransactionState> {
  const profile = await getCurrentProfile();
  if (!profile || !canManageFleet(profile.role)) {
    return { error: "You don't have permission to record fuel transactions." };
  }

  const vehicleId = String(formData.get("vehicle_id") ?? "").trim();
  if (!vehicleId) return { error: "A vehicle is required." };

  const occurredAtRaw = String(formData.get("occurred_at") ?? "").trim();
  if (!occurredAtRaw) return { error: "A date/time is required." };
  const occurredAt = new Date(occurredAtRaw);
  if (Number.isNaN(occurredAt.getTime())) return { error: "Date/time is not valid." };

  const volumeLiters = Number(formData.get("volume_liters"));
  if (!Number.isFinite(volumeLiters) || volumeLiters <= 0) {
    return { error: "Liters must be a positive number." };
  }

  const pricePerLiter = Number(formData.get("price_per_liter"));
  if (!Number.isFinite(pricePerLiter) || pricePerLiter <= 0) {
    return { error: "Price per liter must be a positive number." };
  }

  const odometerKm = Number(formData.get("odometer_km"));
  if (!Number.isFinite(odometerKm) || odometerKm < 0) {
    return { error: "Odometer reading must be a non-negative number." };
  }

  const overrideReason = String(formData.get("odometer_override_reason") ?? "").trim();

  const supabase = await createClient();

  const provenance = await getVehicleOdometerProvenance(supabase, vehicleId);
  const validation = validateOdometerReading({
    newOdometerKm: odometerKm,
    previousKnownKm: provenance.latest?.odometerKm ?? null,
    overrideReason,
  });
  if (!validation.ok) {
    return { error: validation.error };
  }

  const driverId = String(formData.get("driver_id") ?? "").trim() || null;
  const tripId = String(formData.get("trip_id") ?? "").trim() || null;
  const vendorId = String(formData.get("vendor_id") ?? "").trim() || null;
  const paymentMethod = String(formData.get("payment_method") ?? "").trim() || null;

  const { data, error } = await supabase
    .from("fuel_transactions")
    .insert({
      organization_id: profile.organization_id,
      vehicle_id: vehicleId,
      driver_id: driverId,
      trip_id: tripId,
      vendor_id: vendorId,
      vendor_name: String(formData.get("vendor_name") ?? "").trim() || null,
      occurred_at: occurredAt.toISOString(),
      volume_liters: volumeLiters,
      price_per_liter: pricePerLiter,
      total_amount: Math.round(volumeLiters * pricePerLiter * 100) / 100,
      odometer_km: odometerKm,
      odometer_override_reason: overrideReason || null,
      payment_method: paymentMethod as Database["public"]["Enums"]["payment_method"] | null,
      reference_number: String(formData.get("reference_number") ?? "").trim() || null,
      notes: String(formData.get("notes") ?? "").trim() || null,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  const receiptFile = formData.get("receipt");
  if (receiptFile instanceof File && receiptFile.size > 0) {
    const uploadResult = await uploadReceipt(supabase, {
      organizationId: profile.organization_id,
      transactionId: data.id,
      file: receiptFile,
    });
    if ("error" in uploadResult) return { error: uploadResult.error };

    const { error: updateError } = await supabase
      .from("fuel_transactions")
      .update({ receipt_url: uploadResult.path })
      .eq("id", data.id);
    if (updateError) {
      return { error: `Fuel transaction recorded, but the receipt failed to save: ${updateError.message}` };
    }
  }

  revalidatePath("/finance/fuel");
  revalidatePath(`/vehicles/${vehicleId}`);
  if (tripId) revalidatePath(`/trips/${tripId}`);
  redirect("/finance/fuel");
}

export type VoidFuelTransactionState = { error: string } | { success: true } | null;

/** Fuel transactions are never hard-deleted -- voiding keeps the row with a reason, excluded from totals by `status`. */
export async function voidFuelTransaction(
  _prevState: VoidFuelTransactionState,
  formData: FormData,
): Promise<VoidFuelTransactionState> {
  const profile = await getCurrentProfile();
  if (!profile || !canManageFleet(profile.role)) {
    return { error: "You don't have permission to void fuel transactions." };
  }

  const transactionId = String(formData.get("transaction_id") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  if (!transactionId) return { error: "Missing fuel transaction." };
  if (!reason) return { error: "A reason is required to void a fuel transaction." };

  const supabase = await createClient();
  const stamp = `[Voided ${new Date().toISOString()}] ${reason}`;

  const { data: existing, error: fetchError } = await supabase
    .from("fuel_transactions")
    .select("notes, vehicle_id")
    .eq("id", transactionId)
    .maybeSingle();
  if (fetchError) return { error: fetchError.message };
  if (!existing) return { error: "Fuel transaction not found." };

  const { error } = await supabase
    .from("fuel_transactions")
    .update({ status: "voided", notes: existing.notes ? `${existing.notes}\n${stamp}` : stamp })
    .eq("id", transactionId);
  if (error) return { error: error.message };

  revalidatePath("/finance/fuel");
  revalidatePath(`/vehicles/${existing.vehicle_id}`);
  return { success: true };
}
