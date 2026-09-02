"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { getCurrentProfile } from "@/lib/data/profile";
import { canManageFleet } from "@/lib/domain/permissions";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type CreateVehicleState = { error: string } | null;

export async function createVehicle(
  _prevState: CreateVehicleState,
  formData: FormData,
): Promise<CreateVehicleState> {
  const profile = await getCurrentProfile();
  if (!profile || !canManageFleet(profile.role)) {
    return { error: "You don't have permission to add vehicles." };
  }

  const unitNumber = String(formData.get("unit_number") ?? "").trim();
  if (!unitNumber) {
    return { error: "Vehicle identifier is required." };
  }

  const odometerKm = Number(formData.get("odometer_km"));
  if (!Number.isFinite(odometerKm) || odometerKm < 0) {
    return { error: "Initial mileage must be a non-negative number." };
  }

  const capacityRaw = formData.get("capacity_kg");
  const capacityKg = capacityRaw ? Number(capacityRaw) : null;
  if (capacityKg !== null && (!Number.isFinite(capacityKg) || capacityKg < 0)) {
    return { error: "Capacity must be a non-negative number." };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("vehicles")
    .insert({
      organization_id: profile.organization_id,
      unit_number: unitNumber,
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
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        error: "A vehicle with this identifier or plate number already exists in your organization.",
      };
    }
    return { error: error.message };
  }

  revalidatePath("/vehicles");
  redirect(`/vehicles/${data.id}`);
}
