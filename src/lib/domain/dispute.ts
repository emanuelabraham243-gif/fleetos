import type { Database } from "@/lib/supabase/database.types";

export type DisputeStatus = Database["public"]["Enums"]["dispute_status"];

/** open -> under_review -> resolved/rejected, or withdrawn from either. resolved/rejected/withdrawn are terminal. */
const ALLOWED_TRANSITIONS: Record<DisputeStatus, DisputeStatus[]> = {
  open: ["under_review", "withdrawn"],
  under_review: ["resolved", "rejected", "withdrawn"],
  resolved: [],
  rejected: [],
  withdrawn: [],
};

export function canTransitionDispute(from: DisputeStatus, to: DisputeStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function nextDisputeStatuses(from: DisputeStatus): DisputeStatus[] {
  return ALLOWED_TRANSITIONS[from];
}

export function isOpenDisputeStatus(status: DisputeStatus): boolean {
  return status === "open" || status === "under_review";
}
