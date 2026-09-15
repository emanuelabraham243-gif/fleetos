"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { getIncidentById } from "@/lib/data/incidents";
import { getCurrentProfile } from "@/lib/data/profile";
import { canTransitionIncident, type IncidentStatus } from "@/lib/domain/incident";
import { canManageFleet } from "@/lib/domain/permissions";
import { INCIDENT_STATUS_LABEL } from "@/lib/i18n/labels";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type ReportIncidentState = { error: string } | null;

/** Report Incident -- records the observation only; every incident starts OPEN, never a diagnosis or a fault determination. */
export async function reportIncident(_prevState: ReportIncidentState, formData: FormData): Promise<ReportIncidentState> {
  const profile = await getCurrentProfile();
  if (!profile || !canManageFleet(profile.role)) {
    return { error: "You don't have permission to report incidents." };
  }

  const occurredAtRaw = String(formData.get("occurred_at") ?? "").trim();
  if (!occurredAtRaw) return { error: "A date/time is required." };
  const occurredAt = new Date(occurredAtRaw);
  if (Number.isNaN(occurredAt.getTime())) return { error: "Date/time is not valid." };

  const incidentType = String(formData.get("incident_type") ?? "other").trim();
  const severity = String(formData.get("severity") ?? "low").trim();

  const description = String(formData.get("description") ?? "").trim();
  if (!description) return { error: "A description is required." };

  const vehicleId = String(formData.get("vehicle_id") ?? "").trim() || null;
  const driverId = String(formData.get("driver_id") ?? "").trim() || null;
  const tripId = String(formData.get("trip_id") ?? "").trim() || null;
  const location = String(formData.get("location") ?? "").trim() || null;

  const supabase = await createClient();

  const insertValues: Database["public"]["Tables"]["incidents"]["Insert"] = {
    organization_id: profile.organization_id,
    vehicle_id: vehicleId,
    driver_id: driverId,
    trip_id: tripId,
    incident_type: incidentType as Database["public"]["Enums"]["incident_type"],
    severity: severity as Database["public"]["Enums"]["incident_severity"],
    occurred_at: occurredAt.toISOString(),
    location,
    description,
    created_by: profile.id,
  };

  const { data, error } = await supabase.from("incidents").insert(insertValues).select("id").single();
  if (error) return { error: error.message };

  revalidatePath("/issues/incidents");
  if (vehicleId) revalidatePath(`/vehicles/${vehicleId}`);
  if (driverId) revalidatePath(`/drivers/${driverId}`);
  redirect(`/issues/incidents/${data.id}`);
}

export type TransitionIncidentState = { error: string } | { success: true } | null;

export async function transitionIncidentStatus(
  _prevState: TransitionIncidentState,
  formData: FormData,
): Promise<TransitionIncidentState> {
  const profile = await getCurrentProfile();
  if (!profile || !canManageFleet(profile.role)) {
    return { error: "You don't have permission to change incident status." };
  }

  const incidentId = String(formData.get("incident_id") ?? "").trim();
  const toStatus = String(formData.get("to_status") ?? "").trim() as IncidentStatus;
  if (!incidentId || !toStatus) return { error: "Missing incident or target status." };

  const supabase = await createClient();
  const incident = await getIncidentById(supabase, incidentId);
  if (!incident) return { error: "Incident not found." };

  if (!canTransitionIncident(incident.status, toStatus)) {
    return {
      error: `Cannot move an incident from ${INCIDENT_STATUS_LABEL[incident.status]} to ${INCIDENT_STATUS_LABEL[toStatus]}.`,
    };
  }

  const { error } = await supabase.from("incidents").update({ status: toStatus }).eq("id", incidentId);
  if (error) return { error: error.message };

  revalidatePath(`/issues/incidents/${incidentId}`);
  revalidatePath("/issues/incidents");
  return { success: true };
}

async function uploadEvidenceFile(
  supabase: Supabase,
  params: { organizationId: string; incidentId: string; file: File },
): Promise<{ path: string } | { error: string }> {
  const path = `${params.organizationId}/incidents/${params.incidentId}/${Date.now()}-${params.file.name}`;
  const { error } = await supabase.storage
    .from("attachments")
    .upload(path, params.file, { contentType: params.file.type || undefined });
  if (error) return { error: `Evidence note saved, but the file failed to upload: ${error.message}` };
  return { path };
}

export type AddEvidenceState = { error: string } | { success: true } | null;

/** Every evidence row is explicitly tagged fact/calculation/user_input/interpretation/decision at the point it's added -- never left to be inferred later. */
export async function addIncidentEvidence(_prevState: AddEvidenceState, formData: FormData): Promise<AddEvidenceState> {
  const profile = await getCurrentProfile();
  if (!profile || !canManageFleet(profile.role)) {
    return { error: "You don't have permission to add evidence." };
  }

  const incidentId = String(formData.get("incident_id") ?? "").trim();
  if (!incidentId) return { error: "Missing incident." };

  const kind = String(formData.get("kind") ?? "").trim();
  if (!kind) return { error: "An evidence kind is required." };

  const source = String(formData.get("source") ?? "other").trim();
  const content = String(formData.get("content") ?? "").trim();
  if (!content) return { error: "A description of the evidence is required." };

  const recordedAtRaw = String(formData.get("recorded_at") ?? "").trim();
  const recordedAt = recordedAtRaw ? new Date(recordedAtRaw) : new Date();
  if (Number.isNaN(recordedAt.getTime())) return { error: "Date/time is not valid." };

  const supabase = await createClient();

  const insertValues: Database["public"]["Tables"]["incident_evidence"]["Insert"] = {
    organization_id: profile.organization_id,
    incident_id: incidentId,
    kind: kind as Database["public"]["Enums"]["evidence_kind"],
    source: source as Database["public"]["Enums"]["evidence_source"],
    content,
    recorded_at: recordedAt.toISOString(),
    created_by: profile.id,
  };

  const { data, error } = await supabase.from("incident_evidence").insert(insertValues).select("id").single();
  if (error) return { error: error.message };

  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    const uploadResult = await uploadEvidenceFile(supabase, {
      organizationId: profile.organization_id,
      incidentId,
      file,
    });
    if ("error" in uploadResult) return { error: uploadResult.error };
    const { error: updateError } = await supabase
      .from("incident_evidence")
      .update({ file_url: uploadResult.path })
      .eq("id", data.id);
    if (updateError) return { error: `Evidence saved, but the file failed to save: ${updateError.message}` };
  }

  revalidatePath(`/issues/incidents/${incidentId}`);
  return { success: true };
}
