import type { Database } from "@/lib/supabase/database.types";

export type MaintenanceIssueStatus = Database["public"]["Enums"]["maintenance_issue_status"];
export type MaintenanceIssueSeverity = Database["public"]["Enums"]["maintenance_issue_severity"];
export type MaintenanceIssueType = Database["public"]["Enums"]["maintenance_issue_type"];
export type MaintenanceIssueSource = Database["public"]["Enums"]["maintenance_issue_source"];

/**
 * WORK_ORDER_CREATED and RESOLVED are set by the app itself (when a work
 * order referencing this issue is created, and when that work order
 * completes -- see `src/app/(app)/maintenance/work-orders/actions.ts`),
 * never picked from a dropdown; they're still part of this table so the
 * transition is validated the same way everywhere. DISMISSED is only
 * reachable before a work order exists -- once one has been created the
 * issue is either resolved through it or the work order itself is
 * cancelled, never silently dismissed out from under an open repair.
 */
export const ALLOWED_ISSUE_TRANSITIONS: Record<MaintenanceIssueStatus, readonly MaintenanceIssueStatus[]> = {
  REPORTED: ["ACKNOWLEDGED", "DISMISSED"],
  ACKNOWLEDGED: ["UNDER_DIAGNOSIS", "DISMISSED"],
  UNDER_DIAGNOSIS: ["WORK_ORDER_CREATED", "RESOLVED", "DISMISSED"],
  WORK_ORDER_CREATED: ["RESOLVED"],
  RESOLVED: ["CLOSED"],
  CLOSED: [],
  DISMISSED: [],
};

export function canTransitionIssue(from: MaintenanceIssueStatus, to: MaintenanceIssueStatus): boolean {
  return ALLOWED_ISSUE_TRANSITIONS[from].includes(to);
}

export function nextIssueStatuses(from: MaintenanceIssueStatus): readonly MaintenanceIssueStatus[] {
  return ALLOWED_ISSUE_TRANSITIONS[from];
}

export function isOpenIssueStatus(status: MaintenanceIssueStatus): boolean {
  return status !== "RESOLVED" && status !== "CLOSED" && status !== "DISMISSED";
}
