"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { getCurrentProfile } from "@/lib/data/profile";
import { canManageFleet } from "@/lib/domain/permissions";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

function readScheduleFields(formData: FormData) {
  const vehicleId = String(formData.get("vehicle_id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const intervalKmRaw = String(formData.get("interval_km") ?? "").trim();
  const intervalDaysRaw = String(formData.get("interval_days") ?? "").trim();
  const lastDoneAt = String(formData.get("last_done_at") ?? "").trim();
  const lastDoneOdometerKmRaw = String(formData.get("last_done_odometer_km") ?? "").trim();
  const isActive = formData.get("is_active") === "on";
  const notes = String(formData.get("notes") ?? "").trim();

  return {
    vehicleId,
    title,
    intervalKm: intervalKmRaw ? Number(intervalKmRaw) : null,
    intervalDays: intervalDaysRaw ? Number(intervalDaysRaw) : null,
    lastDoneAt: lastDoneAt || null,
    lastDoneOdometerKm: lastDoneOdometerKmRaw ? Number(lastDoneOdometerKmRaw) : null,
    isActive,
    notes: notes || null,
  };
}

/**
 * next_due_at/next_due_odometer_km are always computed here from the
 * interval and the last-service facts -- never accepted as form input, so
 * they can never drift from the rule that's supposed to produce them (spec
 * Part 6: "the system should calculate the next due point").
 */
function computeNextDue(fields: ReturnType<typeof readScheduleFields>): {
  nextDueAt: string | null;
  nextDueOdometerKm: number | null;
} {
  let nextDueAt: string | null = null;
  if (fields.intervalDays !== null && fields.lastDoneAt !== null) {
    const date = new Date(fields.lastDoneAt);
    date.setDate(date.getDate() + fields.intervalDays);
    nextDueAt = date.toISOString();
  }

  const nextDueOdometerKm =
    fields.intervalKm !== null && fields.lastDoneOdometerKm !== null
      ? fields.lastDoneOdometerKm + fields.intervalKm
      : null;

  return { nextDueAt, nextDueOdometerKm };
}

export type ScheduleFormState = { error: string } | null;

export async function createMaintenanceSchedule(
  _prevState: ScheduleFormState,
  formData: FormData,
): Promise<ScheduleFormState> {
  const profile = await getCurrentProfile();
  if (!profile || !canManageFleet(profile.role)) {
    return { error: "You don't have permission to create maintenance schedules." };
  }

  const fields = readScheduleFields(formData);
  if (!fields.vehicleId) return { error: "A vehicle is required." };
  if (!fields.title) return { error: "A service type is required." };
  if (fields.intervalKm === null && fields.intervalDays === null) {
    return { error: "At least one interval (mileage or time) is required." };
  }

  const { nextDueAt, nextDueOdometerKm } = computeNextDue(fields);

  const insertValues: Database["public"]["Tables"]["maintenance_schedules"]["Insert"] = {
    organization_id: profile.organization_id,
    vehicle_id: fields.vehicleId,
    title: fields.title,
    interval_km: fields.intervalKm,
    interval_days: fields.intervalDays,
    last_done_at: fields.lastDoneAt,
    last_done_odometer_km: fields.lastDoneOdometerKm,
    next_due_at: nextDueAt,
    next_due_odometer_km: nextDueOdometerKm,
    is_active: fields.isActive,
    notes: fields.notes,
  };

  const supabase = await createClient();
  const { error } = await supabase.from("maintenance_schedules").insert(insertValues);
  if (error) return { error: error.message };

  revalidatePath("/maintenance");
  revalidatePath("/maintenance/schedules");
  revalidatePath(`/vehicles/${fields.vehicleId}`);
  redirect("/maintenance/schedules");
}

export async function updateMaintenanceSchedule(
  scheduleId: string,
  _prevState: ScheduleFormState,
  formData: FormData,
): Promise<ScheduleFormState> {
  const profile = await getCurrentProfile();
  if (!profile || !canManageFleet(profile.role)) {
    return { error: "You don't have permission to edit maintenance schedules." };
  }

  const fields = readScheduleFields(formData);
  if (!fields.vehicleId) return { error: "A vehicle is required." };
  if (!fields.title) return { error: "A service type is required." };
  if (fields.intervalKm === null && fields.intervalDays === null) {
    return { error: "At least one interval (mileage or time) is required." };
  }

  const { nextDueAt, nextDueOdometerKm } = computeNextDue(fields);

  const supabase = await createClient();
  const { error } = await supabase
    .from("maintenance_schedules")
    .update({
      vehicle_id: fields.vehicleId,
      title: fields.title,
      interval_km: fields.intervalKm,
      interval_days: fields.intervalDays,
      last_done_at: fields.lastDoneAt,
      last_done_odometer_km: fields.lastDoneOdometerKm,
      next_due_at: nextDueAt,
      next_due_odometer_km: nextDueOdometerKm,
      is_active: fields.isActive,
      notes: fields.notes,
    })
    .eq("id", scheduleId);

  if (error) return { error: error.message };

  revalidatePath("/maintenance");
  revalidatePath("/maintenance/schedules");
  revalidatePath(`/vehicles/${fields.vehicleId}`);
  redirect("/maintenance/schedules");
}
