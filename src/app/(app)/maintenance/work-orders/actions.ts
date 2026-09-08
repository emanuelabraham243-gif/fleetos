"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { getMaintenanceIssueById } from "@/lib/data/maintenance-issues";
import { getCurrentProfile } from "@/lib/data/profile";
import { getWorkOrderById, getWorkOrderExpenses } from "@/lib/data/work-orders";
import { canTransitionIssue } from "@/lib/domain/maintenance-issue";
import { canManageFleet } from "@/lib/domain/permissions";
import { canTransitionWorkOrder, computeWorkOrderCostBreakdown, type WorkOrderStatus } from "@/lib/domain/work-order";
import { WORK_ORDER_STATUS_LABEL } from "@/lib/i18n/labels";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

async function uploadWorkOrderFile(
  supabase: Supabase,
  params: { organizationId: string; workOrderId: string; uploadedBy: string; file: File },
): Promise<{ error: string } | null> {
  const path = `${params.organizationId}/work-orders/${params.workOrderId}/${Date.now()}-${params.file.name}`;
  const { error: uploadError } = await supabase.storage
    .from("attachments")
    .upload(path, params.file, { contentType: params.file.type || undefined });
  if (uploadError) return { error: `Work order created, but the attachment failed to upload: ${uploadError.message}` };

  const { error: insertError } = await supabase.from("attachments").insert({
    organization_id: params.organizationId,
    entity_type: "work_order",
    entity_id: params.workOrderId,
    file_url: path,
    file_name: params.file.name,
    mime_type: params.file.type || null,
    size_bytes: params.file.size,
    uploaded_by: params.uploadedBy,
  });
  if (insertError) return { error: `Work order created, but the attachment failed to save: ${insertError.message}` };
  return null;
}

export type CreateWorkOrderState = { error: string } | null;

export async function createWorkOrder(
  _prevState: CreateWorkOrderState,
  formData: FormData,
): Promise<CreateWorkOrderState> {
  const profile = await getCurrentProfile();
  if (!profile || !canManageFleet(profile.role)) {
    return { error: "You don't have permission to create work orders." };
  }

  const vehicleId = String(formData.get("vehicle_id") ?? "").trim();
  if (!vehicleId) return { error: "A vehicle is required." };

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "A service type / title is required." };

  const description = String(formData.get("description") ?? "").trim();
  const maintenanceType = String(formData.get("maintenance_type") ?? "CORRECTIVE").trim();
  const priority = String(formData.get("priority") ?? "NORMAL").trim();
  const maintenanceIssueId = String(formData.get("maintenance_issue_id") ?? "").trim() || null;
  const vendorId = String(formData.get("vendor_id") ?? "").trim() || null;
  const assignedTo = String(formData.get("assigned_to") ?? "").trim() || null;
  const estimatedCompletionRaw = String(formData.get("estimated_completion_at") ?? "").trim();
  const estimatedCostRaw = String(formData.get("estimated_cost") ?? "").trim();
  const odometerRaw = formData.get("odometer_km");
  const odometerKm = odometerRaw ? Number(odometerRaw) : null;

  const supabase = await createClient();

  const insertValues: Database["public"]["Tables"]["work_orders"]["Insert"] = {
    organization_id: profile.organization_id,
    vehicle_id: vehicleId,
    title,
    description: description || null,
    maintenance_type: maintenanceType as Database["public"]["Enums"]["maintenance_type"],
    priority: priority as Database["public"]["Enums"]["work_order_priority"],
    maintenance_issue_id: maintenanceIssueId,
    vendor_id: vendorId,
    assigned_to: assignedTo,
    odometer_km: odometerKm,
    estimated_completion_at: estimatedCompletionRaw ? new Date(estimatedCompletionRaw).toISOString() : null,
    estimated_cost: estimatedCostRaw ? Number(estimatedCostRaw) : null,
  };

  const { data, error } = await supabase.from("work_orders").insert(insertValues).select("id").single();
  if (error) return { error: error.message };

  // Creating a work order from an issue is the one place WORK_ORDER_CREATED
  // is set -- never picked from the issue's own status dropdown. A second
  // work order against an issue already at this status is a no-op here,
  // not an error (the first attempt didn't resolve it, so a new one is
  // being opened).
  if (maintenanceIssueId) {
    const issue = await getMaintenanceIssueById(supabase, maintenanceIssueId);
    if (issue && canTransitionIssue(issue.status, "WORK_ORDER_CREATED")) {
      await supabase.from("maintenance_issues").update({ status: "WORK_ORDER_CREATED" }).eq("id", maintenanceIssueId);
    }
  }

  const attachmentFile = formData.get("attachment");
  if (attachmentFile instanceof File && attachmentFile.size > 0) {
    const uploadResult = await uploadWorkOrderFile(supabase, {
      organizationId: profile.organization_id,
      workOrderId: data.id,
      uploadedBy: profile.id,
      file: attachmentFile,
    });
    if (uploadResult) return uploadResult;
  }

  revalidatePath("/maintenance");
  revalidatePath("/maintenance/work-orders");
  if (maintenanceIssueId) revalidatePath(`/maintenance/issues/${maintenanceIssueId}`);
  revalidatePath(`/vehicles/${vehicleId}`);
  redirect(`/maintenance/work-orders/${data.id}`);
}

export type TransitionWorkOrderState = { error: string } | { success: true } | null;

/**
 * Every status move except COMPLETED (see `completeWorkOrder`, which needs
 * completion mileage/parts/labor and updates the originating schedule --
 * too much to fold into a generic status dropdown). started_at and
 * downtime_start_at are set the first time the order actually reaches
 * IN_REPAIR, never earlier and never overwritten on a later visit to that
 * status.
 */
export async function transitionWorkOrderStatus(
  _prevState: TransitionWorkOrderState,
  formData: FormData,
): Promise<TransitionWorkOrderState> {
  const profile = await getCurrentProfile();
  if (!profile || !canManageFleet(profile.role)) {
    return { error: "You don't have permission to change work order status." };
  }

  const workOrderId = String(formData.get("work_order_id") ?? "").trim();
  const toStatus = String(formData.get("to_status") ?? "").trim() as WorkOrderStatus;
  if (!workOrderId || !toStatus) return { error: "Missing work order or target status." };
  if (toStatus === "COMPLETED") {
    return { error: "Use Complete Work Order to finish this order." };
  }

  const supabase = await createClient();
  const workOrder = await getWorkOrderById(supabase, workOrderId);
  if (!workOrder) return { error: "Work order not found." };

  if (!canTransitionWorkOrder(workOrder.status, toStatus)) {
    return {
      error: `Cannot move a work order from ${WORK_ORDER_STATUS_LABEL[workOrder.status]} to ${WORK_ORDER_STATUS_LABEL[toStatus]}.`,
    };
  }

  const update: Database["public"]["Tables"]["work_orders"]["Update"] = { status: toStatus };
  if (toStatus === "IN_REPAIR" && !workOrder.started_at) {
    update.started_at = new Date().toISOString();
    update.downtime_start_at = new Date().toISOString();
  }
  if (toStatus === "CANCELLED") {
    update.closed_at = new Date().toISOString();
  }

  const { error } = await supabase.from("work_orders").update(update).eq("id", workOrderId);
  if (error) return { error: error.message };

  // Vehicle status never changes on its own just because a work order
  // moved -- only when this explicit checkbox was checked on the same
  // action, which is the "authorized decision" the spec requires.
  const updateVehicleStatus = formData.get("update_vehicle_status") === "on";
  if (updateVehicleStatus && toStatus === "IN_REPAIR") {
    await supabase.from("vehicles").update({ status: "maintenance" }).eq("id", workOrder.vehicle_id);
  } else if (updateVehicleStatus && toStatus === "CANCELLED") {
    await maybeReturnVehicleToActive(supabase, workOrder.vehicle_id);
  }

  revalidatePath("/maintenance");
  revalidatePath(`/maintenance/work-orders/${workOrderId}`);
  revalidatePath(`/vehicles/${workOrder.vehicle_id}`);
  return { success: true };
}

/** Only clears a vehicle's `maintenance` status back to `active` when no other work order is still open on it -- never while a second repair is in progress. */
async function maybeReturnVehicleToActive(supabase: Supabase, vehicleId: string): Promise<void> {
  const { data: openOrders } = await supabase
    .from("work_orders")
    .select("id")
    .eq("vehicle_id", vehicleId)
    .not("status", "in", "(COMPLETED,CANCELLED)");

  if ((openOrders ?? []).length === 0) {
    await supabase.from("vehicles").update({ status: "active" }).eq("id", vehicleId).eq("status", "maintenance");
  }
}

export type AddPartState = { error: string } | { success: true } | null;

/** quantity x unit_cost is always computed here -- never accepted as a submitted total that could drift from the two numbers that produced it. */
export async function addMaintenancePart(_prevState: AddPartState, formData: FormData): Promise<AddPartState> {
  const profile = await getCurrentProfile();
  if (!profile || !canManageFleet(profile.role)) {
    return { error: "You don't have permission to record parts." };
  }

  const workOrderId = String(formData.get("work_order_id") ?? "").trim();
  const partName = String(formData.get("part_name") ?? "").trim();
  if (!workOrderId || !partName) return { error: "A part name is required." };

  const quantity = Number(formData.get("quantity") ?? "1");
  const unitCost = Number(formData.get("unit_cost") ?? "0");
  if (!Number.isFinite(quantity) || quantity <= 0) return { error: "Quantity must be a positive number." };
  if (!Number.isFinite(unitCost) || unitCost < 0) return { error: "Unit cost must be a non-negative number." };

  const supabase = await createClient();
  // total_cost is a DB-generated column (quantity * unit_cost) -- never set explicitly here.
  const { error } = await supabase.from("maintenance_parts").insert({
    organization_id: profile.organization_id,
    work_order_id: workOrderId,
    part_name: partName,
    part_number: String(formData.get("part_number") ?? "").trim() || null,
    quantity,
    unit_cost: unitCost,
    vendor_id: String(formData.get("vendor_id") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
  });
  if (error) return { error: error.message };

  revalidatePath(`/maintenance/work-orders/${workOrderId}`);
  return { success: true };
}

export type AddLaborState = { error: string } | { success: true } | null;

/** Hourly (hours x rate) or a fixed charge -- never both; total_cost is always the one the app computed. */
export async function addMaintenanceLabor(_prevState: AddLaborState, formData: FormData): Promise<AddLaborState> {
  const profile = await getCurrentProfile();
  if (!profile || !canManageFleet(profile.role)) {
    return { error: "You don't have permission to record labor." };
  }

  const workOrderId = String(formData.get("work_order_id") ?? "").trim();
  if (!workOrderId) return { error: "Missing work order." };

  const billingMode = String(formData.get("billing_mode") ?? "hourly");
  const hoursRaw = String(formData.get("hours") ?? "").trim();
  const rateRaw = String(formData.get("rate") ?? "").trim();
  const fixedAmountRaw = String(formData.get("fixed_amount") ?? "").trim();

  let totalCost: number;
  let hours: number | null = null;
  let rate: number | null = null;
  let fixedAmount: number | null = null;

  if (billingMode === "fixed") {
    fixedAmount = Number(fixedAmountRaw);
    if (!Number.isFinite(fixedAmount) || fixedAmount < 0) return { error: "Fixed amount must be a non-negative number." };
    totalCost = fixedAmount;
  } else {
    hours = Number(hoursRaw);
    rate = Number(rateRaw);
    if (!Number.isFinite(hours) || hours <= 0) return { error: "Hours must be a positive number." };
    if (!Number.isFinite(rate) || rate < 0) return { error: "Rate must be a non-negative number." };
    totalCost = hours * rate;
  }

  const supabase = await createClient();
  const { error } = await supabase.from("maintenance_labor").insert({
    organization_id: profile.organization_id,
    work_order_id: workOrderId,
    vendor_id: String(formData.get("vendor_id") ?? "").trim() || null,
    technician_name: String(formData.get("technician_name") ?? "").trim() || null,
    description: String(formData.get("description") ?? "").trim() || null,
    hours,
    rate,
    fixed_amount: fixedAmount,
    total_cost: Math.round(totalCost * 100) / 100,
    notes: String(formData.get("notes") ?? "").trim() || null,
  });
  if (error) return { error: error.message };

  revalidatePath(`/maintenance/work-orders/${workOrderId}`);
  return { success: true };
}

export type CompleteWorkOrderState = { error: string } | null;

/**
 * The only place a work order reaches COMPLETED. Actual cost is always
 * recomputed from parts + labor + linked expenses here -- never trusted
 * from a form field -- and, when a schedule was picked, that schedule's
 * last-service facts are updated and its next due point recalculated the
 * same way `createMaintenanceSchedule` does, so the two code paths can
 * never compute "next due" differently.
 */
export async function completeWorkOrder(
  _prevState: CompleteWorkOrderState,
  formData: FormData,
): Promise<CompleteWorkOrderState> {
  const profile = await getCurrentProfile();
  if (!profile || !canManageFleet(profile.role)) {
    return { error: "You don't have permission to complete work orders." };
  }

  const workOrderId = String(formData.get("work_order_id") ?? "").trim();
  if (!workOrderId) return { error: "Missing work order." };

  const completionOdometerRaw = String(formData.get("completion_odometer_km") ?? "").trim();
  if (!completionOdometerRaw) return { error: "Completion mileage is required." };
  const completionOdometerKm = Number(completionOdometerRaw);
  if (!Number.isFinite(completionOdometerKm) || completionOdometerKm < 0) {
    return { error: "Completion mileage must be a non-negative number." };
  }

  const completionNotes = String(formData.get("completion_notes") ?? "").trim();
  if (!completionNotes) return { error: "A summary of the work performed is required." };

  const scheduleId = String(formData.get("maintenance_schedule_id") ?? "").trim() || null;

  const supabase = await createClient();
  const workOrder = await getWorkOrderById(supabase, workOrderId);
  if (!workOrder) return { error: "Work order not found." };

  if (!canTransitionWorkOrder(workOrder.status, "COMPLETED")) {
    return { error: `Cannot complete a work order from ${WORK_ORDER_STATUS_LABEL[workOrder.status]}.` };
  }

  const expenses = await getWorkOrderExpenses(supabase, workOrderId);
  const partsCost = workOrder.parts.reduce((sum, p) => sum + Number(p.total_cost ?? 0), 0);
  const laborCost = workOrder.labor.reduce((sum, l) => sum + Number(l.total_cost), 0);
  const otherCost = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const breakdown = computeWorkOrderCostBreakdown({
    partsCost,
    laborCost,
    otherCost,
    currency: workOrder.currency,
  });

  const completedAt = new Date().toISOString();
  const update: Database["public"]["Tables"]["work_orders"]["Update"] = {
    status: "COMPLETED",
    closed_at: completedAt,
    completion_odometer_km: completionOdometerKm,
    completion_notes: completionNotes,
    total_cost: breakdown.total,
    maintenance_schedule_id: scheduleId,
  };
  if (workOrder.downtime_start_at && !workOrder.downtime_end_at) {
    update.downtime_end_at = completedAt;
  }

  const { error } = await supabase.from("work_orders").update(update).eq("id", workOrderId);
  if (error) return { error: error.message };

  if (scheduleId) {
    const { data: schedule, error: scheduleError } = await supabase
      .from("maintenance_schedules")
      .select("interval_km, interval_days")
      .eq("id", scheduleId)
      .maybeSingle();
    if (scheduleError) return { error: scheduleError.message };

    if (schedule) {
      let nextDueAt: string | null = null;
      if (schedule.interval_days !== null) {
        const date = new Date(completedAt);
        date.setDate(date.getDate() + schedule.interval_days);
        nextDueAt = date.toISOString();
      }
      const nextDueOdometerKm = schedule.interval_km !== null ? completionOdometerKm + schedule.interval_km : null;

      const { error: updateScheduleError } = await supabase
        .from("maintenance_schedules")
        .update({
          last_done_at: completedAt,
          last_done_odometer_km: completionOdometerKm,
          next_due_at: nextDueAt,
          next_due_odometer_km: nextDueOdometerKm,
        })
        .eq("id", scheduleId);
      if (updateScheduleError) return { error: updateScheduleError.message };
    }
  }

  if (workOrder.maintenance_issue?.id) {
    const issue = await getMaintenanceIssueById(supabase, workOrder.maintenance_issue.id);
    if (issue && canTransitionIssue(issue.status, "RESOLVED")) {
      await supabase
        .from("maintenance_issues")
        .update({ status: "RESOLVED", resolved_at: completedAt })
        .eq("id", workOrder.maintenance_issue.id);
    }
  }

  // Same explicit, opt-in rule as `transitionWorkOrderStatus`: completing
  // this work order never silently returns the vehicle to service.
  if (formData.get("update_vehicle_status") === "on") {
    await maybeReturnVehicleToActive(supabase, workOrder.vehicle_id);
  }

  revalidatePath("/maintenance");
  revalidatePath("/maintenance/schedules");
  revalidatePath(`/maintenance/work-orders/${workOrderId}`);
  revalidatePath(`/vehicles/${workOrder.vehicle_id}`);
  redirect(`/maintenance/work-orders/${workOrderId}`);
}
