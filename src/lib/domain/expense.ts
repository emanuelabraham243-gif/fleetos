import type { Database } from "@/lib/supabase/database.types";

export type ExpenseApprovalStatus = Database["public"]["Enums"]["expense_approval_status"];
export type RecordState = Database["public"]["Enums"]["record_state"];

/**
 * The spec's user-facing vocabulary (RECORDED/PENDING_REVIEW/APPROVED/
 * REJECTED/VOIDED) is one status word, but under the hood it's two
 * orthogonal facts: `record_state` (is this row the authoritative record,
 * shared with fuel_transactions/revenues/payments) and `approval_status`
 * (has a human reviewed it, expense-specific). This is the one place that
 * combines them for display -- nowhere else compares against the merged
 * word, so the two underlying columns stay the source of truth.
 */
export type ExpenseDisplayStatus = ExpenseApprovalStatus | "VOIDED";

export function computeExpenseDisplayStatus(
  recordState: RecordState,
  approvalStatus: ExpenseApprovalStatus,
): ExpenseDisplayStatus {
  if (recordState === "voided") return "VOIDED";
  return approvalStatus;
}

/**
 * Whether an approve/reject action is legal from the current approval
 * status -- mirrors the trip/delivery state machines: a rejected or
 * already-approved expense can't be silently re-reviewed without first
 * moving back to PENDING_REVIEW.
 */
export function canReviewExpense(approvalStatus: ExpenseApprovalStatus): boolean {
  return approvalStatus === "PENDING_REVIEW" || approvalStatus === "RECORDED";
}
