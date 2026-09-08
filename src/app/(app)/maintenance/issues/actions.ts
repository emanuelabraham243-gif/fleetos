"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { getMaintenanceIssueById } from "@/lib/data/maintenance-issues";
import { getCurrentProfile } from "@/lib/data/profile";
import { canTransitionIssue, type MaintenanceIssueStatus } from "@/lib/domain/maintenance-issue";
import { canManageFleet } from "@/lib/domain/permissions";
import { MAINTENANCE_ISSUE_STATUS_LABEL } from "@/lib/i18n/labels";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

async function uploadIssuePhoto(
  supabase: Supabase,
  params: { organizationId: string; issueId: string; uploadedBy: string; file: File },
): Promise<{ path: string } | { error: string }> {
  const path = `${params.organizationId}/maintenance-issues/${params.issueId}/${Date.now()}-${params.file.name}`;
  const { error } = await supabase.storage
    .from("attachments")
    .upload(path, params.file, { contentType: params.file.type || undefined });
  if (error) {
    return { error: `Issue recorded, but the photo failed to upload: ${error.message}` };
  }

  const { error: insertError } = await supabase.from("attachments").insert({
    organization_id: params.organizationId,
    entity_type: "maintenance_issue",
    entity_id: params.issueId,
    file_url: path,
    file_name: params.file.name,
    mime_type: params.file.type || null,
    size_bytes: params.file.size,
    uploaded_by: params.uploadedBy,
  });
  if (insertError) {
    return { error: `Issue recorded, but the photo failed to save: ${insertError.message}` };
  }
  return { path };
}

export type CreateIssueState = { error: string } | null;

/**
 * Report Issue records an observation, never a diagnosis -- the form has
 * no field for "root cause" or "what's broken", only what was directly
 * observed. The workflow that turns this into a repair (acknowledge,
 * diagnose, create a work order) is a separate, later, human decision.
 */
export async function createMaintenanceIssue(
  _prevState: CreateIssueState,
  formData: FormData,
): Promise<CreateIssueState> {
  const profile = await getCurrentProfile();
  if (!profile || !canManageFleet(profile.role)) {
    return { error: "You don't have permission to report maintenance issues." };
  }

  const vehicleId = String(formData.get("vehicle_id") ?? "").trim();
  if (!vehicleId) return { error: "A vehicle is required." };

  const issueType = String(formData.get("issue_type") ?? "").trim();
  if (!issueType) return { error: "An issue type is required." };

  const description = String(formData.get("description") ?? "").trim();
  if (!description) return { error: "A description is required." };

  const reportedAtRaw = String(formData.get("reported_at") ?? "").trim();
  if (!reportedAtRaw) return { error: "A reported date/time is required." };
  const reportedAt = new Date(reportedAtRaw);
  if (Number.isNaN(reportedAt.getTime())) return { error: "Reported date/time is not valid." };

  const severity = String(formData.get("severity") ?? "medium").trim();
  const driverId = String(formData.get("driver_id") ?? "").trim() || null;
  const odometerRaw = formData.get("odometer_km");
  const odometerKm = odometerRaw ? Number(odometerRaw) : null;
  if (odometerRaw && (!Number.isFinite(odometerKm) || (odometerKm ?? 0) < 0)) {
    return { error: "Current mileage must be a non-negative number." };
  }

  const supabase = await createClient();

  const insertValues: Database["public"]["Tables"]["maintenance_issues"]["Insert"] = {
    organization_id: profile.organization_id,
    vehicle_id: vehicleId,
    driver_id: driverId,
    issue_type: issueType as Database["public"]["Enums"]["maintenance_issue_type"],
    title: String(formData.get("title") ?? "").trim() || description.slice(0, 80),
    description,
    severity: severity as Database["public"]["Enums"]["maintenance_issue_severity"],
    odometer_km: odometerKm,
    reported_at: reportedAt.toISOString(),
    reported_by: profile.id,
    source: "driver_report",
  };

  const { data, error } = await supabase.from("maintenance_issues").insert(insertValues).select("id").single();
  if (error) return { error: error.message };

  const photoFile = formData.get("photo");
  if (photoFile instanceof File && photoFile.size > 0) {
    const uploadResult = await uploadIssuePhoto(supabase, {
      organizationId: profile.organization_id,
      issueId: data.id,
      uploadedBy: profile.id,
      file: photoFile,
    });
    if ("error" in uploadResult) return { error: uploadResult.error };
  }

  revalidatePath("/maintenance");
  revalidatePath(`/vehicles/${vehicleId}`);
  redirect(`/maintenance/issues/${data.id}`);
}

export type TransitionIssueState = { error: string } | { success: true } | null;

/**
 * The only place a maintenance issue's status is ever written by a human
 * action (WORK_ORDER_CREATED and RESOLVED are set automatically -- see
 * `src/app/(app)/maintenance/work-orders/actions.ts`). Dismissing requires
 * a reason, and the reason is kept on the row, never just discarded.
 */
export async function transitionMaintenanceIssue(
  _prevState: TransitionIssueState,
  formData: FormData,
): Promise<TransitionIssueState> {
  const profile = await getCurrentProfile();
  if (!profile || !canManageFleet(profile.role)) {
    return { error: "You don't have permission to update maintenance issues." };
  }

  const issueId = String(formData.get("issue_id") ?? "").trim();
  const toStatus = String(formData.get("to_status") ?? "").trim() as MaintenanceIssueStatus;
  if (!issueId || !toStatus) return { error: "Missing issue or target status." };

  const dismissedReason = String(formData.get("dismissed_reason") ?? "").trim();
  if (toStatus === "DISMISSED" && !dismissedReason) {
    return { error: "A reason is required to dismiss an issue." };
  }

  const supabase = await createClient();
  const issue = await getMaintenanceIssueById(supabase, issueId);
  if (!issue) return { error: "Issue not found." };

  if (!canTransitionIssue(issue.status, toStatus)) {
    return {
      error: `Cannot move an issue from ${MAINTENANCE_ISSUE_STATUS_LABEL[issue.status]} to ${MAINTENANCE_ISSUE_STATUS_LABEL[toStatus]}.`,
    };
  }

  const update: Database["public"]["Tables"]["maintenance_issues"]["Update"] = { status: toStatus };
  if (toStatus === "DISMISSED") update.dismissed_reason = dismissedReason;
  if (toStatus === "RESOLVED" && !issue.resolved_at) update.resolved_at = new Date().toISOString();

  const { error } = await supabase.from("maintenance_issues").update(update).eq("id", issueId);
  if (error) return { error: error.message };

  revalidatePath("/maintenance");
  revalidatePath(`/maintenance/issues/${issueId}`);
  return { success: true };
}
