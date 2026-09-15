import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { computeFuelConsumption } from "@/lib/domain/fuel-consumption";
import { getVehicleFinancialSummary } from "@/lib/data/vehicle-finance";
import type { Database } from "@/lib/supabase/database.types";

export interface VehicleAnalyticsRow {
  vehicleId: string;
  unitNumber: string;
  costPerKm: number | null;
  litersPer100Km: number | null;
  maintenanceCost: number | null;
  totalRevenue: number | null;
  profit: number | null;
  currency: string;
}

/**
 * Per-vehicle analytics, each row a pure read of what's already recorded --
 * `costPerKm`/`profit` reuse the exact same `getVehicleFinancialSummary`
 * Vehicle Detail's Overview tab shows, so this page can never disagree with
 * that one. `litersPer100Km` is computed fresh here (with real
 * `volume_liters`, unlike the distance-only call inside
 * `getVehicleFinancialSummary`) via the same `computeFuelConsumption` used
 * everywhere else -- null whenever fewer than two odometer-tagged fuel
 * transactions exist, never a guessed number.
 */
export async function getFleetAnalytics(
  supabase: SupabaseClient<Database>,
  vehicles: { id: string; unit_number: string }[],
): Promise<VehicleAnalyticsRow[]> {
  return Promise.all(
    vehicles.map(async (vehicle) => {
      const [summary, fuelRes] = await Promise.all([
        getVehicleFinancialSummary(supabase, vehicle.id),
        supabase
          .from("fuel_transactions")
          .select("occurred_at, odometer_km, volume_liters")
          .eq("status", "active")
          .eq("vehicle_id", vehicle.id),
      ]);

      if (fuelRes.error) {
        throw new Error(`Failed to load fuel transactions for analytics: ${fuelRes.error.message}`);
      }

      const consumption = computeFuelConsumption(
        (fuelRes.data ?? []).map((row) => ({
          occurred_at: row.occurred_at,
          odometer_km: row.odometer_km,
          volume_liters: Number(row.volume_liters),
        })),
      );

      return {
        vehicleId: vehicle.id,
        unitNumber: vehicle.unit_number,
        costPerKm: summary.costPerKm,
        litersPer100Km: consumption.litersPer100Km,
        maintenanceCost: summary.maintenanceCost,
        totalRevenue: summary.totalRevenue,
        profit: summary.profit,
        currency: summary.currency,
      };
    }),
  );
}

export interface MaintenanceCostBreakdown {
  preventiveCost: number;
  correctiveCost: number;
  totalCost: number;
  currency: string;
}

/** Completed work orders only -- an in-progress order's total_cost is null and correctly excluded, never estimated. */
export async function getMaintenanceCostBreakdown(supabase: SupabaseClient<Database>): Promise<MaintenanceCostBreakdown> {
  const { data, error } = await supabase
    .from("work_orders")
    .select("maintenance_type, total_cost, currency")
    .eq("status", "COMPLETED")
    .not("total_cost", "is", null);

  if (error) {
    throw new Error(`Failed to load maintenance cost breakdown: ${error.message}`);
  }

  const rows = data ?? [];
  const preventiveCost = rows
    .filter((r) => r.maintenance_type === "PREVENTIVE")
    .reduce((sum, r) => sum + Number(r.total_cost), 0);
  const correctiveCost = rows
    .filter((r) => r.maintenance_type !== "PREVENTIVE")
    .reduce((sum, r) => sum + Number(r.total_cost), 0);

  const round = (v: number) => Math.round(v * 100) / 100;

  return {
    preventiveCost: round(preventiveCost),
    correctiveCost: round(correctiveCost),
    totalCost: round(preventiveCost + correctiveCost),
    currency: rows[0]?.currency ?? "ETB",
  };
}

export interface DeliveryOutcomeBreakdown {
  status: Database["public"]["Enums"]["delivery_status"];
  count: number;
  percentage: number;
}

/**
 * Delivery outcome distribution across the whole fleet -- a real,
 * observed count per status, never an invented "on-time %" the schema
 * has no field to actually compute (deliveries have no
 * expected-vs-actual-arrival pair to compare).
 */
export async function getDeliveryOutcomeBreakdown(
  supabase: SupabaseClient<Database>,
): Promise<{ total: number; breakdown: DeliveryOutcomeBreakdown[] }> {
  const { data, error } = await supabase.from("deliveries").select("status");
  if (error) {
    throw new Error(`Failed to load delivery outcomes: ${error.message}`);
  }

  const counts = new Map<Database["public"]["Enums"]["delivery_status"], number>();
  for (const row of data ?? []) {
    counts.set(row.status, (counts.get(row.status) ?? 0) + 1);
  }

  const total = data?.length ?? 0;
  const breakdown = Array.from(counts.entries()).map(([status, count]) => ({
    status,
    count,
    percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
  }));

  return { total, breakdown };
}
