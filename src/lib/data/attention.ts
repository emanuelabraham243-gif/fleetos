import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { FleetBoardVehicle } from "@/lib/data/fleet";
import { daysUntil, formatDueText } from "@/lib/days-until";
import { formatGpsFreshness } from "@/lib/gps/status";
import { VEHICLE_DOCUMENT_TYPE_LABEL } from "@/lib/i18n/labels";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Every attention item is either a FACT (something directly observed --
 * a GPS gap, a document's own expiry date) or a CALCULATION (something
 * derived, like a maintenance interval). None of these are accusations --
 * they're evidence for a human to act on. See product principle in
 * README: "GPS recorded speed above threshold", never "driver was speeding".
 */
export type AttentionCategory = "GPS_OFFLINE" | "DOCUMENT_EXPIRING" | "MAINTENANCE_DUE";
export type AttentionSeverity = "info" | "warning" | "critical";

export interface AttentionItem {
  id: string;
  category: AttentionCategory;
  kind: "fact" | "calculation";
  severity: AttentionSeverity;
  vehicleId: string | null;
  unitNumber: string | null;
  description: string;
}

const DOCUMENT_LOOKAHEAD_DAYS = 30;
const MAINTENANCE_LOOKAHEAD_DAYS = 14;

/**
 * Evidence FleetOS can surface without a human having entered anything --
 * derived from data already in the fleet board (GPS gaps) plus two direct
 * reads (documents, maintenance schedules) that don't belong in the fleet
 * board query itself.
 */
export async function getAttentionItems(
  supabase: SupabaseClient<Database>,
  fleetBoard: FleetBoardVehicle[],
): Promise<AttentionItem[]> {
  const items: AttentionItem[] = [];
  const today = new Date();
  const lookaheadDate = (days: number) =>
    new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  for (const vehicle of fleetBoard) {
    if (vehicle.gpsStatus === "offline" || vehicle.gpsStatus === "unknown") {
      const { label } = formatGpsFreshness(vehicle.vehicle_locations?.recorded_at);
      items.push({
        id: `gps-${vehicle.id}`,
        category: "GPS_OFFLINE",
        kind: "fact",
        severity: vehicle.gpsStatus === "unknown" ? "warning" : "critical",
        vehicleId: vehicle.id,
        unitNumber: vehicle.unit_number,
        description: `Unit ${vehicle.unit_number}: ${label}`,
      });
    }
  }

  const { data: documents, error: documentsError } = await supabase
    .from("vehicle_documents")
    .select("id, document_type, expires_at, vehicle:vehicles(id, unit_number)")
    .eq("status", "active")
    .not("expires_at", "is", null)
    .lte("expires_at", lookaheadDate(DOCUMENT_LOOKAHEAD_DAYS))
    .order("expires_at", { ascending: true });

  if (documentsError) {
    throw new Error(`Failed to load expiring documents: ${documentsError.message}`);
  }

  for (const doc of documents ?? []) {
    if (!doc.expires_at) continue;
    const days = daysUntil(doc.expires_at, today);
    items.push({
      id: `document-${doc.id}`,
      category: "DOCUMENT_EXPIRING",
      kind: "fact",
      severity: days < 0 || days <= 7 ? "critical" : "warning",
      vehicleId: doc.vehicle?.id ?? null,
      unitNumber: doc.vehicle?.unit_number ?? null,
      description: `${VEHICLE_DOCUMENT_TYPE_LABEL[doc.document_type]} for unit ${doc.vehicle?.unit_number ?? "unknown"} ${formatDueText(days, "expires")}`,
    });
  }

  const { data: schedules, error: schedulesError } = await supabase
    .from("maintenance_schedules")
    .select("id, title, next_due_at, vehicle:vehicles(id, unit_number)")
    .eq("is_active", true)
    .not("next_due_at", "is", null)
    .lte("next_due_at", lookaheadDate(MAINTENANCE_LOOKAHEAD_DAYS))
    .order("next_due_at", { ascending: true });

  if (schedulesError) {
    throw new Error(`Failed to load maintenance schedules: ${schedulesError.message}`);
  }

  for (const schedule of schedules ?? []) {
    if (!schedule.next_due_at) continue;
    const days = daysUntil(schedule.next_due_at, today);
    items.push({
      id: `maintenance-${schedule.id}`,
      category: "MAINTENANCE_DUE",
      kind: "calculation",
      severity: days < 0 || days <= 3 ? "critical" : "warning",
      vehicleId: schedule.vehicle?.id ?? null,
      unitNumber: schedule.vehicle?.unit_number ?? null,
      description: `${schedule.title} for unit ${schedule.vehicle?.unit_number ?? "unknown"} ${formatDueText(days, "due")}`,
    });
  }

  return items;
}
