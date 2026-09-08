import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

const ISSUE_DETAIL_SELECT =
  "*, vehicle:vehicles(id, unit_number, license_plate), driver:drivers(id, full_name), reported_by_profile:profiles!maintenance_issues_reported_by_fkey(id, full_name)";

export type MaintenanceIssueDetail = Database["public"]["Tables"]["maintenance_issues"]["Row"] & {
  vehicle: Pick<Database["public"]["Tables"]["vehicles"]["Row"], "id" | "unit_number" | "license_plate"> | null;
  driver: Pick<Database["public"]["Tables"]["drivers"]["Row"], "id" | "full_name"> | null;
  reported_by_profile: Pick<Database["public"]["Tables"]["profiles"]["Row"], "id" | "full_name"> | null;
};

export interface MaintenanceIssueFilters {
  vehicleId?: string;
  status?: Database["public"]["Enums"]["maintenance_issue_status"];
}

/** The full `/maintenance` issues list (also used when a summary card filters to "Open Issues"). */
export async function getMaintenanceIssuesList(
  supabase: SupabaseClient<Database>,
  filters: MaintenanceIssueFilters = {},
): Promise<MaintenanceIssueDetail[]> {
  let query = supabase.from("maintenance_issues").select(ISSUE_DETAIL_SELECT).order("reported_at", {
    ascending: false,
  });

  if (filters.vehicleId) query = query.eq("vehicle_id", filters.vehicleId);
  if (filters.status) query = query.eq("status", filters.status);

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to load maintenance issues: ${error.message}`);
  }
  return data;
}

/** Single-issue read for the issue detail view and the review/dismiss actions. */
export async function getMaintenanceIssueById(
  supabase: SupabaseClient<Database>,
  issueId: string,
): Promise<MaintenanceIssueDetail | null> {
  const { data, error } = await supabase
    .from("maintenance_issues")
    .select(ISSUE_DETAIL_SELECT)
    .eq("id", issueId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load maintenance issue: ${error.message}`);
  }
  return data;
}

/** Every work order created against this issue -- an issue can have more than one if the first attempt didn't resolve it. */
export async function getWorkOrdersForIssue(
  supabase: SupabaseClient<Database>,
  issueId: string,
): Promise<Pick<Database["public"]["Tables"]["work_orders"]["Row"], "id" | "title" | "status">[]> {
  const { data, error } = await supabase
    .from("work_orders")
    .select("id, title, status")
    .eq("maintenance_issue_id", issueId)
    .order("opened_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load work orders for issue: ${error.message}`);
  }
  return data;
}
