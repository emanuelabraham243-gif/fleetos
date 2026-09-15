import type { Database } from "@/lib/supabase/database.types";

export type ContractStatus = Database["public"]["Enums"]["contract_status"];

/** draft -> active -> expired/terminated. expired/terminated are terminal -- a contract that ended is never silently reopened. */
const ALLOWED_TRANSITIONS: Record<ContractStatus, ContractStatus[]> = {
  draft: ["active", "terminated"],
  active: ["expired", "terminated"],
  expired: [],
  terminated: [],
};

export function canTransitionContract(from: ContractStatus, to: ContractStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function nextContractStatuses(from: ContractStatus): ContractStatus[] {
  return ALLOWED_TRANSITIONS[from];
}
