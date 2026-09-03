"use server";

import { revalidatePath } from "next/cache";

import { getCurrentAssignmentsByDriver } from "@/lib/data/driver-assignments";
import { getActiveTrips } from "@/lib/data/trips";
import { getCurrentProfile } from "@/lib/data/profile";
import { canManageFleet } from "@/lib/domain/permissions";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

async function requireFleetManager() {
  const profile = await getCurrentProfile();
  if (!profile || !canManageFleet(profile.role)) {
    throw new Error("You don't have permission to make this change.");
  }
  return profile;
}

export type AssignVehicleState = { error: string } | { warning: string } | null;

/**
 * The driver-side mirror of `assignDriver` in vehicles/[id]/actions.ts --
 * same "close the open row, insert a new one, never delete history" shape.
 * Unlike that action, this one checks for conflicts first: a driver already
 * on an open assignment elsewhere, or already on an active trip, is shown a
 * clear warning instead of being silently reassigned. Passing `force=true`
 * (the user having seen and accepted the warning) proceeds anyway.
 */
export async function assignVehicleToDriver(
  driverId: string,
  _prevState: AssignVehicleState,
  formData: FormData,
): Promise<AssignVehicleState> {
  const vehicleId = String(formData.get("vehicleId") ?? "");
  if (!vehicleId) {
    return { error: "Choose a vehicle." };
  }
  const force = formData.get("force") === "true";

  try {
    const profile = await requireFleetManager();
    const supabase = await createClient();

    if (!force) {
      const [currentAssignments, activeTrips] = await Promise.all([
        getCurrentAssignmentsByDriver(supabase),
        getActiveTrips(supabase),
      ]);

      const existingAssignment = currentAssignments.get(driverId);
      if (existingAssignment && existingAssignment.vehicle_id !== vehicleId) {
        return {
          warning: `This driver is already assigned to Unit ${existingAssignment.vehicle?.unit_number ?? "another vehicle"}. Assigning here will end that assignment.`,
        };
      }

      const activeTrip = activeTrips.find((trip) => trip.driver_id === driverId);
      if (activeTrip) {
        return {
          warning: `This driver is already assigned to an active trip (${activeTrip.trip_number}, ${activeTrip.status}). Reassigning their vehicle now will not change that trip.`,
        };
      }
    }

    const { error: closeError } = await supabase
      .from("vehicle_driver_assignments")
      .update({ unassigned_at: new Date().toISOString() })
      .eq("vehicle_id", vehicleId)
      .is("unassigned_at", null);
    if (closeError) throw new Error(closeError.message);

    const { error: closeDriverError } = await supabase
      .from("vehicle_driver_assignments")
      .update({ unassigned_at: new Date().toISOString() })
      .eq("driver_id", driverId)
      .is("unassigned_at", null);
    if (closeDriverError) throw new Error(closeDriverError.message);

    const { error: insertError } = await supabase.from("vehicle_driver_assignments").insert({
      organization_id: profile.organization_id,
      vehicle_id: vehicleId,
      driver_id: driverId,
      assigned_by: profile.id,
    });
    if (insertError) throw new Error(insertError.message);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to assign vehicle." };
  }

  revalidatePath(`/drivers/${driverId}`);
  revalidatePath("/drivers");
  revalidatePath(`/vehicles/${vehicleId}`);
  revalidatePath("/vehicles");
  return null;
}

export type EndAssignmentState = { error: string } | null;

/** Closes a driver's open assignment without opening a new one -- "remove driver from vehicle". */
export async function endDriverAssignment(
  driverId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- required by the useActionState action signature
  _prevState: EndAssignmentState,
): Promise<EndAssignmentState> {
  try {
    await requireFleetManager();
    const supabase = await createClient();

    const { error } = await supabase
      .from("vehicle_driver_assignments")
      .update({ unassigned_at: new Date().toISOString() })
      .eq("driver_id", driverId)
      .is("unassigned_at", null);
    if (error) throw new Error(error.message);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to end the assignment." };
  }

  revalidatePath(`/drivers/${driverId}`);
  revalidatePath("/drivers");
  return null;
}

export type UploadDriverDocumentState = { error: string } | { success: true } | null;

/** Uploads to the existing (Phase 1) private "documents" Storage bucket and records the row -- no new storage system. */
export async function uploadDriverDocument(
  driverId: string,
  _prevState: UploadDriverDocumentState,
  formData: FormData,
): Promise<UploadDriverDocumentState> {
  const profile = await getCurrentProfile();
  if (!profile || !canManageFleet(profile.role)) {
    return { error: "You don't have permission to upload driver documents." };
  }

  const documentType = String(formData.get("document_type") ?? "") as
    | Database["public"]["Enums"]["document_type_driver"]
    | "";
  if (!documentType) return { error: "A document type is required." };

  const documentNumber = String(formData.get("document_number") ?? "").trim() || null;
  const issuedAt = String(formData.get("issued_at") ?? "").trim() || null;
  const expiresAt = String(formData.get("expires_at") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  const supabase = await createClient();

  let fileUrl: string | null = null;
  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    const path = `${profile.organization_id}/drivers/${driverId}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(path, file, { contentType: file.type || undefined });
    if (uploadError) return { error: `Failed to upload file: ${uploadError.message}` };
    fileUrl = path;
  }

  const { error } = await supabase.from("driver_documents").insert({
    organization_id: profile.organization_id,
    driver_id: driverId,
    document_type: documentType,
    document_number: documentNumber,
    issued_at: issuedAt,
    expires_at: expiresAt,
    notes,
    file_url: fileUrl,
  });

  if (error) return { error: error.message };

  revalidatePath(`/drivers/${driverId}`);
  return { success: true };
}
