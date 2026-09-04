import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { DateRange } from "@/lib/domain/date-range";
import { computeFuelSummary, type FuelSummary } from "@/lib/domain/fuel-summary";
import { buildOdometerProvenance, type OdometerProvenance, type OdometerReading } from "@/lib/domain/odometer-provenance";
import type { Database } from "@/lib/supabase/database.types";

export type FuelTransaction = Database["public"]["Tables"]["fuel_transactions"]["Row"] & {
  driver: Pick<Database["public"]["Tables"]["drivers"]["Row"], "id" | "full_name"> | null;
};

export async function getVehicleFuelTransactions(
  supabase: SupabaseClient<Database>,
  vehicleId: string,
): Promise<FuelTransaction[]> {
  const { data, error } = await supabase
    .from("fuel_transactions")
    .select("*, driver:drivers(id, full_name)")
    .eq("vehicle_id", vehicleId)
    .order("occurred_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load fuel transactions: ${error.message}`);
  }

  return data;
}

export interface FuelMetrics {
  totalLiters: number;
  totalCost: number;
  averageCostPerLiter: number;
  /** null when there isn't enough odometer spread to compute a rate -- never a guessed number. */
  costPerKm: number | null;
  currency: string;
}

/**
 * Only computes what the data actually supports. `costPerKm` needs at
 * least two transactions with distinct odometer readings on the *active*
 * (non-voided) transactions -- otherwise it's left null and the UI shows
 * "Insufficient data" rather than a number nobody should trust.
 */
export function computeFuelMetrics(transactions: FuelTransaction[]): FuelMetrics | null {
  const active = transactions.filter((t) => t.status === "active");
  if (active.length === 0) return null;

  const totalLiters = active.reduce((sum, t) => sum + Number(t.volume_liters), 0);
  const totalCost = active.reduce((sum, t) => sum + Number(t.total_amount), 0);
  const currency = active[0].currency;

  const odometers = active
    .map((t) => t.odometer_km)
    .filter((km): km is number => km !== null)
    .sort((a, b) => a - b);

  let costPerKm: number | null = null;
  if (odometers.length >= 2) {
    const distanceCovered = odometers[odometers.length - 1] - odometers[0];
    if (distanceCovered > 0) {
      costPerKm = totalCost / distanceCovered;
    }
  }

  return {
    totalLiters: Math.round(totalLiters * 10) / 10,
    totalCost: Math.round(totalCost * 100) / 100,
    averageCostPerLiter: Math.round((totalCost / totalLiters) * 100) / 100,
    costPerKm: costPerKm !== null ? Math.round(costPerKm * 100) / 100 : null,
    currency,
  };
}

// ============================================================================
// /fuel page: list, summary, and Record Fuel support -- everything below
// this line is new in Phase 6. `FuelTransaction`/`getVehicleFuelTransactions`/
// `computeFuelMetrics` above are unchanged so the existing Vehicle Detail
// Fuel tab keeps working exactly as it did.
// ============================================================================

const FUEL_LIST_SELECT =
  "*, vehicle:vehicles(id, unit_number, license_plate), driver:drivers(id, full_name), trip:trips(id, trip_number), vendor:vendors(id, name), recorded_by_profile:profiles!fuel_transactions_created_by_fkey(id, full_name)";

export type FuelTransactionListItem = Database["public"]["Tables"]["fuel_transactions"]["Row"] & {
  vehicle: Pick<Database["public"]["Tables"]["vehicles"]["Row"], "id" | "unit_number" | "license_plate"> | null;
  driver: Pick<Database["public"]["Tables"]["drivers"]["Row"], "id" | "full_name"> | null;
  trip: Pick<Database["public"]["Tables"]["trips"]["Row"], "id" | "trip_number"> | null;
  vendor: Pick<Database["public"]["Tables"]["vendors"]["Row"], "id" | "name"> | null;
  recorded_by_profile: Pick<Database["public"]["Tables"]["profiles"]["Row"], "id" | "full_name"> | null;
};

export interface FuelListFilters {
  dateRange: DateRange;
  vehicleId?: string;
  driverId?: string;
  vendorId?: string;
  /** Matches against vendor_name, reference_number, notes (case-insensitive). */
  search?: string;
}

function applyFuelFilters<
  T extends {
    eq: (column: string, value: string) => T;
    gte: (column: string, value: string) => T;
    lt: (column: string, value: string) => T;
    or: (filters: string) => T;
  },
>(query: T, filters: FuelListFilters): T {
  let q: T = query.eq("status", "active").gte("occurred_at", filters.dateRange.startIso).lt("occurred_at", filters.dateRange.endIso);
  if (filters.vehicleId) q = q.eq("vehicle_id", filters.vehicleId);
  if (filters.driverId) q = q.eq("driver_id", filters.driverId);
  if (filters.vendorId) q = q.eq("vendor_id", filters.vendorId);
  if (filters.search) {
    const term = filters.search.trim();
    if (term.length > 0) {
      const escaped = term.replace(/[%_]/g, (c) => `\\${c}`);
      q = q.or(`vendor_name.ilike.%${escaped}%,reference_number.ilike.%${escaped}%,notes.ilike.%${escaped}%`);
    }
  }
  return q;
}

/**
 * The `/fuel` list query -- every active fuel transaction in the caller's
 * organization within the filtered date range, newest first, with the
 * vehicle/driver/trip/vendor it's attached to. A transaction with no
 * trip_id is a real fact ("no trip was linked"), never guessed from a
 * time-window correlation.
 */
export async function getFuelTransactionsList(
  supabase: SupabaseClient<Database>,
  filters: FuelListFilters,
): Promise<FuelTransactionListItem[]> {
  const query = applyFuelFilters(supabase.from("fuel_transactions").select(FUEL_LIST_SELECT), filters).order(
    "occurred_at",
    { ascending: false },
  );

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to load fuel transactions: ${error.message}`);
  }
  return data;
}

/** Summary cards for `/fuel` -- same filters as the list, so the cards and table always agree on what's in view. */
export async function getFuelSummary(
  supabase: SupabaseClient<Database>,
  filters: FuelListFilters,
): Promise<FuelSummary> {
  const query = applyFuelFilters(
    supabase.from("fuel_transactions").select("vehicle_id, odometer_km, volume_liters, total_amount, currency"),
    filters,
  );

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to load fuel summary: ${error.message}`);
  }

  return computeFuelSummary(
    (data ?? []).map((row) => ({
      vehicleId: row.vehicle_id,
      odometerKm: row.odometer_km,
      volumeLiters: Number(row.volume_liters),
      totalAmount: Number(row.total_amount),
      currency: row.currency,
    })),
  );
}

/**
 * The two real odometer sources FleetOS has today: the vehicle's own
 * manual reading, and the most recent active fuel transaction's reading.
 * Used both to validate a new Record Fuel submission and to show
 * provenance transparently on the Vehicle Detail Fuel tab -- a conflict
 * between the two is surfaced, never silently resolved by picking one.
 */
export async function getVehicleOdometerProvenance(
  supabase: SupabaseClient<Database>,
  vehicleId: string,
): Promise<OdometerProvenance> {
  const [vehicleRes, fuelRes] = await Promise.all([
    supabase.from("vehicles").select("odometer_km, updated_at").eq("id", vehicleId).maybeSingle(),
    supabase
      .from("fuel_transactions")
      .select("id, odometer_km, occurred_at")
      .eq("vehicle_id", vehicleId)
      .eq("status", "active")
      .not("odometer_km", "is", null)
      .order("occurred_at", { ascending: false })
      .limit(1),
  ]);

  if (vehicleRes.error) throw new Error(`Failed to load vehicle odometer: ${vehicleRes.error.message}`);
  if (fuelRes.error) throw new Error(`Failed to load fuel odometer: ${fuelRes.error.message}`);

  const readings: OdometerReading[] = [];
  if (vehicleRes.data) {
    readings.push({
      source: "manual",
      odometerKm: vehicleRes.data.odometer_km,
      recordedAt: vehicleRes.data.updated_at,
      referenceId: vehicleId,
    });
  }
  const latestFuel = fuelRes.data?.[0];
  if (latestFuel && latestFuel.odometer_km !== null) {
    readings.push({
      source: "fuel_transaction",
      odometerKm: latestFuel.odometer_km,
      recordedAt: latestFuel.occurred_at,
      referenceId: latestFuel.id,
    });
  }

  return buildOdometerProvenance(readings);
}
