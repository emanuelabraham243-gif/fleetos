import type { Database } from "@/lib/supabase/database.types";

export type IncidentStatus = Database["public"]["Enums"]["incident_status"];

/** open -> investigating -> resolved -> closed. closed is terminal -- never silently reopened. */
const ALLOWED_TRANSITIONS: Record<IncidentStatus, IncidentStatus[]> = {
  open: ["investigating", "resolved"],
  investigating: ["resolved"],
  resolved: ["closed", "investigating"],
  closed: [],
};

export function canTransitionIncident(from: IncidentStatus, to: IncidentStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function nextIncidentStatuses(from: IncidentStatus): IncidentStatus[] {
  return ALLOWED_TRANSITIONS[from];
}
