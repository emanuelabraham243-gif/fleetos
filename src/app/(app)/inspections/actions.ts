"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { getCurrentProfile } from "@/lib/data/profile";
import { deriveOverallResult } from "@/lib/domain/inspection";
import { canManageFleet } from "@/lib/domain/permissions";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

interface ChecklistItemInput {
  category: string;
  itemName: string;
  result: Database["public"]["Enums"]["inspection_item_result"];
  note: string | null;
  severity: Database["public"]["Enums"]["maintenance_issue_severity"] | null;
}

export type CreateInspectionState = { error: string } | null;

/**
 * The overall result is always derived from the submitted checklist items
 * (see `deriveOverallResult`), never accepted as its own field -- so it can
 * never say PASSED while a failed item sits underneath it.
 */
export async function createInspection(
  _prevState: CreateInspectionState,
  formData: FormData,
): Promise<CreateInspectionState> {
  const profile = await getCurrentProfile();
  if (!profile || !canManageFleet(profile.role)) {
    return { error: "You don't have permission to record inspections." };
  }

  const vehicleId = String(formData.get("vehicle_id") ?? "").trim();
  if (!vehicleId) return { error: "A vehicle is required." };

  const inspectionType = String(formData.get("inspection_type") ?? "").trim();
  if (!inspectionType) return { error: "An inspection type is required." };

  const performedAtRaw = String(formData.get("performed_at") ?? "").trim();
  if (!performedAtRaw) return { error: "A date/time is required." };
  const performedAt = new Date(performedAtRaw);
  if (Number.isNaN(performedAt.getTime())) return { error: "Date/time is not valid." };

  const itemsRaw = String(formData.get("items_json") ?? "[]");
  let items: ChecklistItemInput[];
  try {
    items = JSON.parse(itemsRaw);
  } catch {
    return { error: "Checklist data was malformed. Please try again." };
  }
  if (!Array.isArray(items) || items.length === 0) {
    return { error: "At least one checklist item is required." };
  }

  const driverId = String(formData.get("driver_id") ?? "").trim() || null;
  const odometerRaw = formData.get("odometer_km");
  const odometerKm = odometerRaw ? Number(odometerRaw) : null;
  if (odometerRaw && (!Number.isFinite(odometerKm) || (odometerKm ?? 0) < 0)) {
    return { error: "Mileage must be a non-negative number." };
  }

  const overallResult = deriveOverallResult(items.map((i) => ({ result: i.result })));

  const supabase = await createClient();

  const insertValues: Database["public"]["Tables"]["inspections"]["Insert"] = {
    organization_id: profile.organization_id,
    vehicle_id: vehicleId,
    driver_id: driverId,
    inspector_id: profile.id,
    inspection_type: inspectionType as Database["public"]["Enums"]["inspection_type"],
    performed_at: performedAt.toISOString(),
    odometer_km: odometerKm,
    findings: String(formData.get("notes") ?? "").trim() || null,
    overall_result: overallResult,
  };

  const { data, error } = await supabase.from("inspections").insert(insertValues).select("id").single();
  if (error) return { error: error.message };

  const itemRows: Database["public"]["Tables"]["inspection_items"]["Insert"][] = items.map((item, index) => ({
    organization_id: profile.organization_id,
    inspection_id: data.id,
    category: item.category,
    item_name: item.itemName,
    result: item.result,
    note: item.note,
    severity: item.result === "FAIL" ? item.severity : null,
    sort_order: index,
  }));

  const { error: itemsError } = await supabase.from("inspection_items").insert(itemRows);
  if (itemsError) return { error: `Inspection recorded, but checklist items failed to save: ${itemsError.message}` };

  revalidatePath("/inspections");
  revalidatePath(`/vehicles/${vehicleId}`);
  redirect(`/inspections/${data.id}`);
}

const CATEGORY_TO_ISSUE_TYPE: Record<string, Database["public"]["Enums"]["maintenance_issue_type"]> = {
  ENGINE: "engine",
  TIRES: "tires",
  BRAKES: "brakes",
  LIGHTS: "electrical",
  BODY: "body",
  GPS: "gps",
  SUSPENSION: "suspension",
};

export type CreateIssueFromItemState = { error: string } | { success: true } | null;

/**
 * "Create Maintenance Issue" from a failed checklist item -- inherits
 * vehicle/inspection/date/inspector context rather than asking for it
 * again, and links back via `inspection_items.created_issue_id` so the
 * inspection history can show how many issues it produced.
 */
export async function createIssueFromInspectionItem(
  _prevState: CreateIssueFromItemState,
  formData: FormData,
): Promise<CreateIssueFromItemState> {
  const profile = await getCurrentProfile();
  if (!profile || !canManageFleet(profile.role)) {
    return { error: "You don't have permission to create maintenance issues." };
  }

  const itemId = String(formData.get("item_id") ?? "").trim();
  const inspectionId = String(formData.get("inspection_id") ?? "").trim();
  const vehicleId = String(formData.get("vehicle_id") ?? "").trim();
  const itemName = String(formData.get("item_name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  const severity = String(formData.get("severity") ?? "medium").trim();
  if (!itemId || !inspectionId || !vehicleId || !itemName) return { error: "Missing checklist item context." };

  const supabase = await createClient();

  const { data: issue, error } = await supabase
    .from("maintenance_issues")
    .insert({
      organization_id: profile.organization_id,
      vehicle_id: vehicleId,
      issue_type: CATEGORY_TO_ISSUE_TYPE[category.toUpperCase()] ?? "other",
      title: `${category}: ${itemName} (failed inspection)`,
      description: note || `Failed during inspection: ${itemName}.`,
      severity: severity as Database["public"]["Enums"]["maintenance_issue_severity"],
      source: "inspection",
      reported_by: profile.id,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  const { error: linkError } = await supabase
    .from("inspection_items")
    .update({ created_issue_id: issue.id })
    .eq("id", itemId);
  if (linkError) return { error: linkError.message };

  revalidatePath(`/inspections/${inspectionId}`);
  revalidatePath("/maintenance");
  return { success: true };
}
