"use server";

import { revalidatePath } from "next/cache";

import { getCurrentProfile } from "@/lib/data/profile";
import { canManageFleet } from "@/lib/domain/permissions";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type CreateDisputeState = { error: string } | { success: true } | null;

/**
 * Raises a dispute against an existing trip, delivery, and/or vehicle --
 * reuses the disputes table Phase 1 already built (see
 * disputes_trip_delivery_vehicle migration) rather than a new issue-tracking
 * system. Bound with the record ids from whichever detail page renders the
 * "Raise Dispute" action, so the caller never has to pass them through the
 * form itself.
 */
export async function createDispute(
  context: {
    tripId: string | null;
    deliveryId: string | null;
    vehicleId: string | null;
    driverId?: string | null;
  },
  _prevState: CreateDisputeState,
  formData: FormData,
): Promise<CreateDisputeState> {
  const profile = await getCurrentProfile();
  if (!profile || !canManageFleet(profile.role)) {
    return { error: "You don't have permission to raise a dispute." };
  }

  const disputeType = String(formData.get("dispute_type") ?? "").trim() as
    | Database["public"]["Enums"]["dispute_type"]
    | "";
  if (!disputeType) {
    return { error: "A dispute type is required." };
  }

  const description = String(formData.get("description") ?? "").trim();
  if (!description) {
    return { error: "A description of the dispute is required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("disputes").insert({
    organization_id: profile.organization_id,
    created_by: profile.id,
    dispute_type: disputeType,
    description,
    trip_id: context.tripId,
    delivery_id: context.deliveryId,
    vehicle_id: context.vehicleId,
    driver_id: context.driverId ?? null,
  });

  if (error) {
    return { error: error.message };
  }

  if (context.tripId) revalidatePath(`/trips/${context.tripId}`);
  if (context.deliveryId) revalidatePath(`/deliveries/${context.deliveryId}`);
  if (context.driverId) revalidatePath(`/drivers/${context.driverId}`);
  revalidatePath("/issues/disputes");

  return { success: true };
}

export type RecordDriverResponseState = { error: string } | { success: true } | null;

/**
 * Appends the driver's own account to a dispute -- never replaces it, and
 * never lets anyone else's edit remove what's already there. The Phase 1
 * audit trigger (now attached to `disputes`, see driver_operations
 * migration) proves that in the record: every version of this field is in
 * `audit_logs`, not just the current one.
 */
export async function recordDriverResponse(
  disputeId: string,
  _prevState: RecordDriverResponseState,
  formData: FormData,
): Promise<RecordDriverResponseState> {
  const profile = await getCurrentProfile();
  if (!profile || !canManageFleet(profile.role)) {
    return { error: "You don't have permission to record a driver response." };
  }

  const response = String(formData.get("driver_response") ?? "").trim();
  if (!response) {
    return { error: "A response is required." };
  }

  const supabase = await createClient();
  const { data: dispute, error: fetchError } = await supabase
    .from("disputes")
    .select("id, driver_response")
    .eq("id", disputeId)
    .maybeSingle();
  if (fetchError) return { error: fetchError.message };
  if (!dispute) return { error: "Dispute not found." };

  const stamp = `[${new Date().toISOString()}] ${response}`;
  const nextResponse = dispute.driver_response ? `${dispute.driver_response}\n\n${stamp}` : stamp;

  const { error } = await supabase
    .from("disputes")
    .update({ driver_response: nextResponse })
    .eq("id", disputeId);

  if (error) return { error: error.message };

  revalidatePath("/issues/disputes");
  return { success: true };
}
