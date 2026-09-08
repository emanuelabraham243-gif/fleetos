import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

export type MaintenancePart = Database["public"]["Tables"]["maintenance_parts"]["Row"] & {
  vendor: Pick<Database["public"]["Tables"]["vendors"]["Row"], "id" | "name"> | null;
};

export type MaintenanceLabor = Database["public"]["Tables"]["maintenance_labor"]["Row"] & {
  vendor: Pick<Database["public"]["Tables"]["vendors"]["Row"], "id" | "name"> | null;
};

const WORK_ORDER_DETAIL_SELECT = `*,
  vehicle:vehicles(id, unit_number, license_plate, odometer_km),
  vendor:vendors(id, name),
  assigned_to_profile:profiles!work_orders_assigned_to_fkey(id, full_name),
  maintenance_issue:maintenance_issues(id, title, issue_type, severity, status),
  parts:maintenance_parts(*, vendor:vendors(id, name)),
  labor:maintenance_labor(*, vendor:vendors(id, name))`;

export type WorkOrderDetail = Database["public"]["Tables"]["work_orders"]["Row"] & {
  vehicle: Pick<
    Database["public"]["Tables"]["vehicles"]["Row"],
    "id" | "unit_number" | "license_plate" | "odometer_km"
  > | null;
  vendor: Pick<Database["public"]["Tables"]["vendors"]["Row"], "id" | "name"> | null;
  assigned_to_profile: Pick<Database["public"]["Tables"]["profiles"]["Row"], "id" | "full_name"> | null;
  maintenance_issue: Pick<
    Database["public"]["Tables"]["maintenance_issues"]["Row"],
    "id" | "title" | "issue_type" | "severity" | "status"
  > | null;
  parts: MaintenancePart[];
  labor: MaintenanceLabor[];
};

export interface WorkOrderFilters {
  vehicleId?: string;
  status?: Database["public"]["Enums"]["work_order_status"];
}

const WORK_ORDER_LIST_SELECT =
  "*, vehicle:vehicles(id, unit_number, license_plate), vendor:vendors(id, name), assigned_to_profile:profiles!work_orders_assigned_to_fkey(id, full_name)";

export type WorkOrderListItem = Database["public"]["Tables"]["work_orders"]["Row"] & {
  vehicle: Pick<Database["public"]["Tables"]["vehicles"]["Row"], "id" | "unit_number" | "license_plate"> | null;
  vendor: Pick<Database["public"]["Tables"]["vendors"]["Row"], "id" | "name"> | null;
  assigned_to_profile: Pick<Database["public"]["Tables"]["profiles"]["Row"], "id" | "full_name"> | null;
};

/** The `/maintenance/work-orders` list. */
export async function getWorkOrdersList(
  supabase: SupabaseClient<Database>,
  filters: WorkOrderFilters = {},
): Promise<WorkOrderListItem[]> {
  let query = supabase.from("work_orders").select(WORK_ORDER_LIST_SELECT).order("opened_at", { ascending: false });

  if (filters.vehicleId) query = query.eq("vehicle_id", filters.vehicleId);
  if (filters.status) query = query.eq("status", filters.status);

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to load work orders: ${error.message}`);
  }
  return data;
}

/** Single work order with parts, labor, vendor/assignee, and the issue it originated from, if any. */
export async function getWorkOrderById(
  supabase: SupabaseClient<Database>,
  workOrderId: string,
): Promise<WorkOrderDetail | null> {
  const { data, error } = await supabase
    .from("work_orders")
    .select(WORK_ORDER_DETAIL_SELECT)
    .eq("id", workOrderId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load work order: ${error.message}`);
  }
  return data;
}

export interface WorkOrderAuditEvent {
  id: string;
  timestamp: string;
  actorName: string | null;
  description: string;
}

function describeWorkOrderAuditEvent(row: { action: string; previous_value: unknown; new_value: unknown }): string {
  const prev = row.previous_value as Record<string, unknown> | null;
  const next = row.new_value as Record<string, unknown> | null;

  if (row.action === "insert") return "Work order created";
  if (row.action === "delete") return "Work order deleted";
  if (prev && next && prev.status !== next.status) {
    return `Status changed from ${String(prev.status)} to ${String(next.status)}`;
  }
  if (prev && next && prev.total_cost !== next.total_cost) {
    return `Cost updated to ${next.total_cost ?? "—"} ${String(next.currency ?? "")}`.trim();
  }
  if (prev && next && prev.assigned_to !== next.assigned_to) {
    return "Assignment changed";
  }
  return "Work order updated";
}

/** Field-level history from the Phase 1 audit trigger, now attached to work_orders (Phase 7) -- who/when/before/after for every change. */
export async function getWorkOrderAuditHistory(
  supabase: SupabaseClient<Database>,
  workOrderId: string,
): Promise<WorkOrderAuditEvent[]> {
  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, created_at, action, previous_value, new_value, actor:profiles(id, full_name)")
    .eq("table_name", "work_orders")
    .eq("record_id", workOrderId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load work order audit history: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    timestamp: row.created_at,
    actorName: row.actor?.full_name ?? null,
    description: describeWorkOrderAuditEvent(row),
  }));
}

/** Expenses recorded against this work order (Phase 6's expenses table, linked via work_order_id) -- the "Other" component of actual cost. */
export async function getWorkOrderExpenses(
  supabase: SupabaseClient<Database>,
  workOrderId: string,
): Promise<Pick<Database["public"]["Tables"]["expenses"]["Row"], "id" | "amount" | "currency" | "category" | "description" | "occurred_at">[]> {
  const { data, error } = await supabase
    .from("expenses")
    .select("id, amount, currency, category, description, occurred_at")
    .eq("work_order_id", workOrderId)
    .eq("status", "active");

  if (error) {
    throw new Error(`Failed to load work order expenses: ${error.message}`);
  }
  return data;
}
