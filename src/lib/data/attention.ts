import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { FleetBoardVehicle } from "@/lib/data/fleet";
import { daysUntil, formatDueText } from "@/lib/days-until";
import { detectFuelAnomalies } from "@/lib/domain/fuel-anomaly";
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
export type AttentionCategory =
  | "GPS_OFFLINE"
  | "DOCUMENT_EXPIRING"
  | "MAINTENANCE_DUE"
  | "EXPENSE_PENDING_REVIEW"
  | "FUEL_REVIEW_RECOMMENDED";
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

  // Restrained on purpose: one aggregate item per signal, never one per
  // transaction -- a busy week of fuel purchases or expense entries should
  // not flood this list the way a per-row alert would.
  const { data: pendingExpenses, error: pendingExpensesError } = await supabase
    .from("expenses")
    .select("id, created_at")
    .eq("status", "active")
    .eq("approval_status", "PENDING_REVIEW")
    .order("created_at", { ascending: true });

  if (pendingExpensesError) {
    throw new Error(`Failed to load pending expenses: ${pendingExpensesError.message}`);
  }

  if (pendingExpenses && pendingExpenses.length > 0) {
    const oldestDays = Math.abs(daysUntil(pendingExpenses[0].created_at, today));
    items.push({
      id: "expenses-pending-review",
      category: "EXPENSE_PENDING_REVIEW",
      kind: "fact",
      severity: oldestDays >= 7 ? "critical" : "warning",
      vehicleId: null,
      unitNumber: null,
      description: `${pendingExpenses.length} expense${pendingExpenses.length === 1 ? "" : "s"} pending review, oldest recorded ${oldestDays} day${oldestDays === 1 ? "" : "s"} ago.`,
    });
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recentFuel, error: recentFuelError } = await supabase
    .from("fuel_transactions")
    .select("id, vehicle_id, occurred_at, odometer_km, volume_liters, receipt_url")
    .eq("status", "active")
    .gte("occurred_at", sevenDaysAgo);

  if (recentFuelError) {
    throw new Error(`Failed to load recent fuel transactions: ${recentFuelError.message}`);
  }

  const fuelByVehicle = new Map<string, typeof recentFuel>();
  for (const t of recentFuel ?? []) {
    const list = fuelByVehicle.get(t.vehicle_id);
    if (list) list.push(t);
    else fuelByVehicle.set(t.vehicle_id, [t]);
  }
  let flaggedFuelCount = 0;
  for (const vehicleTransactions of fuelByVehicle.values()) {
    const anomalies = detectFuelAnomalies(
      vehicleTransactions.map((t) => ({
        id: t.id,
        occurred_at: t.occurred_at,
        odometer_km: t.odometer_km,
        volume_liters: Number(t.volume_liters),
        receipt_url: t.receipt_url,
      })),
    );
    // Only the consumption/odometer-order flags -- missing receipt/odometer
    // are routine data-entry gaps, not the kind of thing worth a Command
    // Center signal.
    const reviewWorthy = new Set(
      anomalies
        .filter((a) => a.kind === "consumption_above_baseline" || a.kind === "consumption_below_baseline" || a.kind === "odometer_inconsistency")
        .map((a) => a.transactionId),
    );
    flaggedFuelCount += reviewWorthy.size;
  }

  if (flaggedFuelCount > 0) {
    items.push({
      id: "fuel-review-recommended",
      category: "FUEL_REVIEW_RECOMMENDED",
      kind: "calculation",
      severity: "warning",
      vehicleId: null,
      unitNumber: null,
      description: `${flaggedFuelCount} fuel transaction${flaggedFuelCount === 1 ? "" : "s"} in the past 7 days flagged for review against each vehicle's own baseline.`,
    });
  }

  return items;
}
