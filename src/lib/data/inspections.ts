import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

export type InspectionItem = Database["public"]["Tables"]["inspection_items"]["Row"];

const INSPECTION_LIST_SELECT =
  "*, vehicle:vehicles(id, unit_number, license_plate), driver:drivers(id, full_name), inspector:profiles!inspections_inspector_id_fkey(id, full_name)";

export type InspectionListItem = Database["public"]["Tables"]["inspections"]["Row"] & {
  vehicle: Pick<Database["public"]["Tables"]["vehicles"]["Row"], "id" | "unit_number" | "license_plate"> | null;
  driver: Pick<Database["public"]["Tables"]["drivers"]["Row"], "id" | "full_name"> | null;
  inspector: Pick<Database["public"]["Tables"]["profiles"]["Row"], "id" | "full_name"> | null;
};

export interface InspectionFilters {
  vehicleId?: string;
}

/** The `/inspections` list, and Vehicle Detail's Inspections tab when scoped by vehicleId. */
export async function getInspectionsList(
  supabase: SupabaseClient<Database>,
  filters: InspectionFilters = {},
): Promise<InspectionListItem[]> {
  let query = supabase.from("inspections").select(INSPECTION_LIST_SELECT).order("performed_at", {
    ascending: false,
  });

  if (filters.vehicleId) query = query.eq("vehicle_id", filters.vehicleId);

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to load inspections: ${error.message}`);
  }
  return data;
}

/** How many maintenance issues were created from each inspection's failed items -- for the history table's "Issues Created" column, one query for the whole list rather than N+1. */
export async function getIssuesCreatedCountByInspection(
  supabase: SupabaseClient<Database>,
  inspectionIds: string[],
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (inspectionIds.length === 0) return counts;

  const { data, error } = await supabase
    .from("inspection_items")
    .select("inspection_id")
    .in("inspection_id", inspectionIds)
    .not("created_issue_id", "is", null);

  if (error) {
    throw new Error(`Failed to load inspection issue links: ${error.message}`);
  }

  for (const row of data ?? []) {
    counts.set(row.inspection_id, (counts.get(row.inspection_id) ?? 0) + 1);
  }
  return counts;
}

export type InspectionDetail = InspectionListItem & { items: InspectionItem[] };

/** Single inspection with every checklist item, ordered the way they were presented on the form. */
export async function getInspectionById(
  supabase: SupabaseClient<Database>,
  inspectionId: string,
): Promise<InspectionDetail | null> {
  const { data, error } = await supabase
    .from("inspections")
    .select(`${INSPECTION_LIST_SELECT}, items:inspection_items(*)`)
    .eq("id", inspectionId)
    .order("sort_order", { referencedTable: "inspection_items", ascending: true })
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load inspection: ${error.message}`);
  }
  return data;
}
