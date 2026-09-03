"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { findTripConflicts } from "@/lib/data/trips";
import { getCurrentProfile } from "@/lib/data/profile";
import { canManageFleet } from "@/lib/domain/permissions";
import { canTransition, type TripStatus } from "@/lib/domain/trip";
import { TRIP_STATUS_LABEL } from "@/lib/i18n/labels";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type CreateTripState = { error: string } | null;

async function nextTripNumber(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<string> {
  const { count, error } = await supabase
    .from("trips")
    .select("id", { count: "exact", head: true });
  if (error) {
    throw new Error(`Failed to determine next trip number: ${error.message}`);
  }
  return `TR-${String((count ?? 0) + 1).padStart(3, "0")}`;
}

export async function createTrip(
  _prevState: CreateTripState,
  formData: FormData,
): Promise<CreateTripState> {
  const profile = await getCurrentProfile();
  if (!profile || !canManageFleet(profile.role)) {
    return { error: "You don't have permission to create trips." };
  }

  const vehicleId = String(formData.get("vehicle_id") ?? "").trim();
  if (!vehicleId) {
    return { error: "A vehicle is required." };
  }

  const scheduledStartRaw = String(formData.get("scheduled_start") ?? "").trim();
  if (!scheduledStartRaw) {
    return { error: "A scheduled start date/time is required." };
  }
  const scheduledStart = new Date(scheduledStartRaw);
  if (Number.isNaN(scheduledStart.getTime())) {
    return { error: "Scheduled start is not a valid date/time." };
  }

  const scheduledEndRaw = String(formData.get("scheduled_end") ?? "").trim();
  let scheduledEnd: Date | null = null;
  if (scheduledEndRaw) {
    scheduledEnd = new Date(scheduledEndRaw);
    if (Number.isNaN(scheduledEnd.getTime())) {
      return { error: "Scheduled end is not a valid date/time." };
    }
    if (scheduledEnd.getTime() <= scheduledStart.getTime()) {
      return { error: "Scheduled end must be after scheduled start." };
    }
  }

  const driverId = String(formData.get("driver_id") ?? "").trim() || null;
  const clientId = String(formData.get("client_id") ?? "").trim() || null;

  const cargoQuantityRaw = formData.get("cargo_quantity");
  const cargoQuantity = cargoQuantityRaw ? Number(cargoQuantityRaw) : null;
  if (cargoQuantity !== null && (!Number.isFinite(cargoQuantity) || cargoQuantity < 0)) {
    return { error: "Cargo quantity must be a non-negative number." };
  }

  const cargoWeightRaw = formData.get("cargo_weight_kg");
  const cargoWeightKg = cargoWeightRaw ? Number(cargoWeightRaw) : null;
  if (cargoWeightKg !== null && (!Number.isFinite(cargoWeightKg) || cargoWeightKg < 0)) {
    return { error: "Cargo weight must be a non-negative number." };
  }

  const supabase = await createClient();

  const conflicts = await findTripConflicts(supabase, {
    vehicleId,
    driverId,
    scheduledStart: scheduledStart.toISOString(),
    scheduledEnd: scheduledEnd ? scheduledEnd.toISOString() : null,
  });
  if (conflicts.length > 0) {
    const conflict = conflicts[0];
    const on = conflict.conflictsOn.join(" and ");
    return {
      error: `This ${on} is already booked on trip ${conflict.tripNumber} during this window. Choose a different vehicle, driver, or time.`,
    };
  }

  const tripNumber = await nextTripNumber(supabase);

  const { data, error } = await supabase
    .from("trips")
    .insert({
      organization_id: profile.organization_id,
      trip_number: tripNumber,
      vehicle_id: vehicleId,
      driver_id: driverId,
      client_id: clientId,
      origin: String(formData.get("origin") ?? "").trim() || null,
      destination: String(formData.get("destination") ?? "").trim() || null,
      scheduled_start: scheduledStart.toISOString(),
      scheduled_end: scheduledEnd ? scheduledEnd.toISOString() : null,
      cargo_description: String(formData.get("cargo_description") ?? "").trim() || null,
      cargo_quantity: cargoQuantity,
      cargo_quantity_unit: String(formData.get("cargo_quantity_unit") ?? "").trim() || null,
      cargo_weight_kg: cargoWeightKg,
      reference_number: String(formData.get("reference_number") ?? "").trim() || null,
      customer_notes: String(formData.get("customer_notes") ?? "").trim() || null,
      notes: String(formData.get("notes") ?? "").trim() || null,
      // Every trip is created in DRAFT regardless of whether a driver was
      // pre-selected -- moving to ASSIGNED is a deliberate, explicit
      // transition (see lib/domain/trip.ts), not an implicit side effect
      // of filling in a form field.
      status: "DRAFT",
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "A trip with this number already exists in your organization. Try again." };
    }
    return { error: error.message };
  }

  revalidatePath("/trips");
  revalidatePath("/dispatch");
  redirect(`/trips/${data.id}`);
}

export type TransitionTripState = { error: string } | null;

/**
 * The single place a trip's status is ever written from the app. Every
 * caller (Dispatch board quick actions, Trip Detail action buttons) goes
 * through this, so `canTransition` is checked exactly once and a trip can
 * never skip a step in DRAFT -> ASSIGNED -> LOADING -> DISPATCHED ->
 * IN_TRANSIT -> ARRIVED -> DELIVERED -> COMPLETED (or an explicit
 * CANCELLED) regardless of which screen triggered the change.
 */
export async function transitionTripStatus(
  _prevState: TransitionTripState,
  formData: FormData,
): Promise<TransitionTripState> {
  const profile = await getCurrentProfile();
  if (!profile || !canManageFleet(profile.role)) {
    return { error: "You don't have permission to change trip status." };
  }

  const tripId = String(formData.get("trip_id") ?? "").trim();
  const toStatus = String(formData.get("to_status") ?? "").trim() as TripStatus;
  if (!tripId || !toStatus) {
    return { error: "Missing trip or target status." };
  }

  const cancellationReason = String(formData.get("cancellation_reason") ?? "").trim();
  if (toStatus === "CANCELLED" && !cancellationReason) {
    return { error: "A reason is required to cancel a trip." };
  }

  const supabase = await createClient();
  const { data: trip, error: fetchError } = await supabase
    .from("trips")
    .select("id, status, actual_start, actual_end, notes")
    .eq("id", tripId)
    .maybeSingle();

  if (fetchError) return { error: fetchError.message };
  if (!trip) return { error: "Trip not found." };

  if (!canTransition(trip.status, toStatus)) {
    return {
      error: `Cannot move a trip from ${TRIP_STATUS_LABEL[trip.status]} to ${TRIP_STATUS_LABEL[toStatus]}.`,
    };
  }

  const update: Database["public"]["Tables"]["trips"]["Update"] = { status: toStatus };
  // actual_start/actual_end are real departure/delivery timestamps, not
  // just status markers -- set once, the first time the trip actually
  // reaches that point, never overwritten on a later transition.
  if (toStatus === "IN_TRANSIT" && !trip.actual_start) {
    update.actual_start = new Date().toISOString();
  }
  if (toStatus === "DELIVERED" && !trip.actual_end) {
    update.actual_end = new Date().toISOString();
  }
  if (toStatus === "CANCELLED" && cancellationReason) {
    const stamp = `[Cancelled ${new Date().toISOString()}] ${cancellationReason}`;
    update.notes = trip.notes ? `${trip.notes}\n${stamp}` : stamp;
  }

  const { error } = await supabase.from("trips").update(update).eq("id", tripId);
  if (error) return { error: error.message };

  revalidatePath("/trips");
  revalidatePath("/dispatch");
  revalidatePath(`/trips/${tripId}`);
  return null;
}
