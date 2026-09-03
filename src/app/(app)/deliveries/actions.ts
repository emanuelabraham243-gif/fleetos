"use server";

import { revalidatePath } from "next/cache";

import { getCurrentProfile } from "@/lib/data/profile";
import { canManageFleet } from "@/lib/domain/permissions";
import { canTransitionDelivery, type DeliveryStatus } from "@/lib/domain/delivery";
import { DELIVERY_STATUS_LABEL } from "@/lib/i18n/labels";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

async function uploadEvidence(
  supabase: Supabase,
  params: { organizationId: string; deliveryId: string; uploadedBy: string; file: File },
): Promise<{ error: string } | null> {
  const path = `${params.organizationId}/deliveries/${params.deliveryId}/${Date.now()}-${params.file.name}`;

  const { error: uploadError } = await supabase.storage
    .from("attachments")
    .upload(path, params.file, { contentType: params.file.type || undefined });
  if (uploadError) {
    return { error: `Failed to upload evidence: ${uploadError.message}` };
  }

  const { error: insertError } = await supabase.from("attachments").insert({
    organization_id: params.organizationId,
    entity_type: "delivery",
    entity_id: params.deliveryId,
    file_url: path,
    file_name: params.file.name,
    mime_type: params.file.type || null,
    size_bytes: params.file.size,
    uploaded_by: params.uploadedBy,
  });
  if (insertError) {
    return { error: `Evidence uploaded but failed to record it: ${insertError.message}` };
  }

  return null;
}

export type TransitionDeliveryState = { error: string } | null;

/**
 * Simple forward moves (PENDING -> IN_TRANSIT -> ARRIVED) and cancellation
 * -- the richer ARRIVED -> outcome transitions (DELIVERED,
 * PARTIALLY_DELIVERED, REFUSED, DAMAGED) go through `confirmDelivery`
 * instead, since those need quantity/reason fields this one doesn't.
 */
export async function transitionDeliveryStatus(
  _prevState: TransitionDeliveryState,
  formData: FormData,
): Promise<TransitionDeliveryState> {
  const profile = await getCurrentProfile();
  if (!profile || !canManageFleet(profile.role)) {
    return { error: "You don't have permission to change delivery status." };
  }

  const deliveryId = String(formData.get("delivery_id") ?? "").trim();
  const toStatus = String(formData.get("to_status") ?? "").trim() as DeliveryStatus;
  if (!deliveryId || !toStatus) {
    return { error: "Missing delivery or target status." };
  }

  const cancellationReason = String(formData.get("cancellation_reason") ?? "").trim();
  if (toStatus === "CANCELLED" && !cancellationReason) {
    return { error: "A reason is required to cancel a delivery." };
  }

  const supabase = await createClient();
  const { data: delivery, error: fetchError } = await supabase
    .from("deliveries")
    .select("id, status, arrived_at, notes")
    .eq("id", deliveryId)
    .maybeSingle();

  if (fetchError) return { error: fetchError.message };
  if (!delivery) return { error: "Delivery not found." };

  if (!canTransitionDelivery(delivery.status, toStatus)) {
    return {
      error: `Cannot move a delivery from ${DELIVERY_STATUS_LABEL[delivery.status]} to ${DELIVERY_STATUS_LABEL[toStatus]}.`,
    };
  }

  const update: Database["public"]["Tables"]["deliveries"]["Update"] = { status: toStatus };
  if (toStatus === "ARRIVED" && !delivery.arrived_at) {
    update.arrived_at = new Date().toISOString();
  }
  if (toStatus === "CANCELLED" && cancellationReason) {
    const stamp = `[Cancelled ${new Date().toISOString()}] ${cancellationReason}`;
    update.notes = delivery.notes ? `${delivery.notes}\n${stamp}` : stamp;
  }

  const { error } = await supabase.from("deliveries").update(update).eq("id", deliveryId);
  if (error) return { error: error.message };

  revalidatePath("/deliveries");
  revalidatePath(`/deliveries/${deliveryId}`);
  return null;
}

export type ConfirmDeliveryState = { error: string } | { success: true } | null;

const OUTCOME_STATUSES: DeliveryStatus[] = ["DELIVERED", "PARTIALLY_DELIVERED", "REFUSED", "DAMAGED"];

/**
 * The ARRIVED -> outcome step: a delivery's real-world result is never a
 * yes/no. Expected and delivered quantity are kept as two separate facts
 * (never collapsed), a refusal or damage report is recorded as evidence,
 * not an accusation against the driver, and a photo can be attached
 * through the same attachments/storage system Phase 1 already built.
 */
export async function confirmDelivery(
  _prevState: ConfirmDeliveryState,
  formData: FormData,
): Promise<ConfirmDeliveryState> {
  const profile = await getCurrentProfile();
  if (!profile || !canManageFleet(profile.role)) {
    return { error: "You don't have permission to confirm deliveries." };
  }

  const deliveryId = String(formData.get("delivery_id") ?? "").trim();
  const outcome = String(formData.get("outcome") ?? "").trim() as DeliveryStatus;
  if (!deliveryId || !OUTCOME_STATUSES.includes(outcome)) {
    return { error: "A valid delivery outcome is required." };
  }

  const supabase = await createClient();
  const { data: delivery, error: fetchError } = await supabase
    .from("deliveries")
    .select("id, status, expected_quantity, notes")
    .eq("id", deliveryId)
    .maybeSingle();

  if (fetchError) return { error: fetchError.message };
  if (!delivery) return { error: "Delivery not found." };

  if (!canTransitionDelivery(delivery.status, outcome)) {
    return {
      error: `Cannot confirm this delivery as ${DELIVERY_STATUS_LABEL[outcome]} from its current status (${DELIVERY_STATUS_LABEL[delivery.status]}).`,
    };
  }

  const deliveredQuantityRaw = formData.get("delivered_quantity");
  if (outcome === "PARTIALLY_DELIVERED" && !deliveredQuantityRaw) {
    return { error: "A delivered quantity is required to record a partial delivery." };
  }
  const deliveredQuantity = deliveredQuantityRaw ? Number(deliveredQuantityRaw) : null;
  if (deliveredQuantityRaw && (!Number.isFinite(deliveredQuantity) || deliveredQuantity === null || deliveredQuantity < 0)) {
    return { error: "Delivered quantity must be a non-negative number." };
  }

  const refusalReason = String(formData.get("refusal_reason") ?? "").trim();
  if (outcome === "REFUSED" && !refusalReason) {
    return { error: "A reason is required to record a refused delivery." };
  }

  const damageNote = String(formData.get("damage_note") ?? "").trim();
  if (outcome === "DAMAGED" && !damageNote) {
    return { error: "A description of the damage is required." };
  }

  const update: Database["public"]["Tables"]["deliveries"]["Update"] = {
    status: outcome,
    delivered_at: new Date().toISOString(),
    confirmed_by: profile.id,
  };
  if (deliveredQuantity !== null) {
    update.delivered_quantity = deliveredQuantity;
  } else if (outcome === "DELIVERED" && delivery.expected_quantity !== null) {
    // A full delivery with no override defaults to "as expected" -- still an
    // explicit fact recorded on the row, not an inferred one.
    update.delivered_quantity = delivery.expected_quantity;
  }
  if (outcome === "REFUSED") {
    update.refusal_reason = refusalReason;
  }
  if (outcome === "DAMAGED") {
    const stamp = `[Damage reported ${new Date().toISOString()}] ${damageNote}`;
    update.notes = delivery.notes ? `${delivery.notes}\n${stamp}` : stamp;
  }

  const { error } = await supabase.from("deliveries").update(update).eq("id", deliveryId);
  if (error) return { error: error.message };

  const evidenceFile = formData.get("evidence");
  if (evidenceFile instanceof File && evidenceFile.size > 0) {
    const uploadResult = await uploadEvidence(supabase, {
      organizationId: profile.organization_id,
      deliveryId,
      uploadedBy: profile.id,
      file: evidenceFile,
    });
    if (uploadResult) return uploadResult;
  }

  revalidatePath("/deliveries");
  revalidatePath(`/deliveries/${deliveryId}`);
  return { success: true };
}
