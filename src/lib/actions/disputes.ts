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
  context: { tripId: string | null; deliveryId: string | null; vehicleId: string | null },
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
  });

  if (error) {
    return { error: error.message };
  }

  if (context.tripId) revalidatePath(`/trips/${context.tripId}`);
  if (context.deliveryId) revalidatePath(`/deliveries/${context.deliveryId}`);
  revalidatePath("/issues/disputes");

  return { success: true };
}
