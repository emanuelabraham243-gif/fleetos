import type { Database } from "@/lib/supabase/database.types";

export type WorkOrderStatus = Database["public"]["Enums"]["work_order_status"];
export type WorkOrderPriority = Database["public"]["Enums"]["work_order_priority"];
export type MaintenanceType = Database["public"]["Enums"]["maintenance_type"];

/**
 * A repair doesn't move in a straight line the way a trip does -- parts can
 * arrive and send it back to IN_REPAIR, an inspection can fail and send it
 * back too -- but it's still a defined graph, not an arbitrary dropdown:
 * every move here is one a real workshop actually makes, and CANCELLED is
 * reachable from anywhere the work hasn't finished.
 */
export const ALLOWED_WORK_ORDER_TRANSITIONS: Record<WorkOrderStatus, readonly WorkOrderStatus[]> = {
  DRAFT: ["APPROVED", "CANCELLED"],
  APPROVED: ["ASSIGNED", "CANCELLED"],
  ASSIGNED: ["DIAGNOSIS", "CANCELLED"],
  DIAGNOSIS: ["AWAITING_PARTS", "IN_REPAIR", "CANCELLED"],
  AWAITING_PARTS: ["IN_REPAIR", "CANCELLED"],
  IN_REPAIR: ["AWAITING_PARTS", "INSPECTION", "CANCELLED"],
  INSPECTION: ["IN_REPAIR", "COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export function canTransitionWorkOrder(from: WorkOrderStatus, to: WorkOrderStatus): boolean {
  return ALLOWED_WORK_ORDER_TRANSITIONS[from].includes(to);
}

export function nextWorkOrderStatuses(from: WorkOrderStatus): readonly WorkOrderStatus[] {
  return ALLOWED_WORK_ORDER_TRANSITIONS[from];
}

export function isTerminalWorkOrderStatus(status: WorkOrderStatus): boolean {
  return ALLOWED_WORK_ORDER_TRANSITIONS[status].length === 0;
}

export interface WorkOrderCostBreakdown {
  partsCost: number;
  laborCost: number;
  otherCost: number;
  total: number;
  currency: string;
}

/**
 * The work order's "actual cost" is never a number someone typed in --
 * it's always the sum of what was actually recorded against it (parts,
 * labor, and any linked expense that isn't already parts/labor). Other is
 * whatever a linked expense contributes on top -- e.g. a towing fee logged
 * as an expense against this work order.
 */
export function computeWorkOrderCostBreakdown(params: {
  partsCost: number;
  laborCost: number;
  otherCost: number;
  currency: string;
}): WorkOrderCostBreakdown {
  const round = (value: number) => Math.round(value * 100) / 100;
  return {
    partsCost: round(params.partsCost),
    laborCost: round(params.laborCost),
    otherCost: round(params.otherCost),
    total: round(params.partsCost + params.laborCost + params.otherCost),
    currency: params.currency,
  };
}

export interface DowntimeResult {
  /** null unless both a real start and end timestamp were recorded -- never estimated. */
  hours: number | null;
}

/** Downtime is only ever a fact about two timestamps someone actually recorded, never an estimate from status changes or elapsed calendar time. */
export function computeDowntime(startAt: string | null, endAt: string | null): DowntimeResult {
  if (startAt === null || endAt === null) return { hours: null };
  const hours = (new Date(endAt).getTime() - new Date(startAt).getTime()) / (60 * 60 * 1000);
  if (hours < 0) return { hours: null };
  return { hours: Math.round(hours * 10) / 10 };
}

/** "2 days 4 hours" / "6 hours" / "Unknown". */
export function formatDowntime(hours: number | null): string {
  if (hours === null) return "Unknown";
  const days = Math.floor(hours / 24);
  const remainingHours = Math.round(hours % 24);
  if (days === 0) return `${remainingHours} hour${remainingHours === 1 ? "" : "s"}`;
  return `${days} day${days === 1 ? "" : "s"} ${remainingHours} hour${remainingHours === 1 ? "" : "s"}`;
}
