"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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

export type AssignDriverState = { error: string } | null;

/**
 * Closes whatever assignment is currently open for this vehicle (if any)
 * and opens a new one -- the old row is never deleted, only marked
 * unassigned_at, so `getVehicleAssignmentHistory` still shows it.
 */
export async function assignDriver(
  vehicleId: string,
  _prevState: AssignDriverState,
  formData: FormData,
): Promise<AssignDriverState> {
  const driverId = String(formData.get("driverId") ?? "");
  if (!driverId) {
    return { error: "Choose a driver." };
  }

  try {
    const profile = await requireFleetManager();
    const supabase = await createClient();

    const { error: closeError } = await supabase
      .from("vehicle_driver_assignments")
      .update({ unassigned_at: new Date().toISOString() })
      .eq("vehicle_id", vehicleId)
      .is("unassigned_at", null);
    if (closeError) throw new Error(closeError.message);

    const { error: insertError } = await supabase.from("vehicle_driver_assignments").insert({
      organization_id: profile.organization_id,
      vehicle_id: vehicleId,
      driver_id: driverId,
      assigned_by: profile.id,
    });
    if (insertError) throw new Error(insertError.message);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to assign driver." };
  }

  revalidatePath(`/vehicles/${vehicleId}`);
  revalidatePath("/vehicles");
  return null;
}

export type UpdateVehicleState = { error: string } | null;

export async function updateVehicle(
  vehicleId: string,
  _prevState: UpdateVehicleState,
  formData: FormData,
): Promise<UpdateVehicleState> {
  try {
    await requireFleetManager();
    const supabase = await createClient();

    const odometerKm = Number(formData.get("odometer_km"));
    if (!Number.isFinite(odometerKm) || odometerKm < 0) {
      return { error: "Mileage must be a non-negative number." };
    }
    const capacityRaw = formData.get("capacity_kg");
    const capacityKg = capacityRaw ? Number(capacityRaw) : null;
    if (capacityKg !== null && (!Number.isFinite(capacityKg) || capacityKg < 0)) {
      return { error: "Capacity must be a non-negative number." };
    }

    const { error } = await supabase
      .from("vehicles")
      .update({
        unit_number: String(formData.get("unit_number") ?? ""),
        license_plate: String(formData.get("license_plate") ?? "") || null,
        make: String(formData.get("make") ?? "") || null,
        model: String(formData.get("model") ?? "") || null,
        year: formData.get("year") ? Number(formData.get("year")) : null,
        vin: String(formData.get("vin") ?? "") || null,
        engine_number: String(formData.get("engine_number") ?? "") || null,
        fuel_type: formData.get("fuel_type") as Database["public"]["Enums"]["fuel_type"],
        capacity_kg: capacityKg,
        odometer_km: odometerKm,
        color: String(formData.get("color") ?? "") || null,
        notes: String(formData.get("notes") ?? "") || null,
      })
      .eq("id", vehicleId);

    if (error) {
      if (error.code === "23505") {
        return { error: "Another vehicle in your organization already uses that plate number." };
      }
      return { error: error.message };
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to update vehicle." };
  }

  revalidatePath(`/vehicles/${vehicleId}`);
  revalidatePath("/vehicles");
  redirect(`/vehicles/${vehicleId}`);
}
