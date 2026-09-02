import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { computeVehicleOperationalStatus, type VehicleOperationalStatus } from "@/lib/domain/vehicle";
import { computeGpsStatus, type GpsStatus } from "@/lib/gps/status";
import type { Database } from "@/lib/supabase/database.types";

import { getActiveTrips, type ActiveTrip } from "./trips";
import { getVehicles, type VehicleWithLocation } from "./vehicles";

export interface FleetBoardVehicle extends VehicleWithLocation {
  gpsStatus: GpsStatus;
  operationalStatus: VehicleOperationalStatus;
  activeTrip: ActiveTrip | null;
}

/**
 * Pure combine step -- no query of its own. Takes vehicles and active
 * trips that were (or could be) fetched once and reused across several
 * sections, and computes each vehicle's GPS/operational status from them.
 */
export function buildFleetBoard(
  vehicles: VehicleWithLocation[],
  activeTrips: ActiveTrip[],
): FleetBoardVehicle[] {
  const activeTripByVehicleId = new Map(activeTrips.map((trip) => [trip.vehicle_id, trip]));

  return vehicles.map((vehicle) => {
    const activeTrip = activeTripByVehicleId.get(vehicle.id) ?? null;
    const gpsStatus = computeGpsStatus(vehicle.vehicle_locations?.recorded_at);
    const operationalStatus = computeVehicleOperationalStatus(
      vehicle.status,
      activeTrip !== null,
      gpsStatus,
    );

    return { ...vehicle, gpsStatus, operationalStatus, activeTrip };
  });
}

/**
 * Convenience wrapper for callers that only need the board and don't
 * already have vehicles/active trips fetched for something else. The
 * Command Center fetches both itself (it needs the raw active trips too,
 * for its own section) and calls `buildFleetBoard` directly instead, so
 * the same trips query never runs twice.
 */
export async function getFleetBoard(
  supabase: SupabaseClient<Database>,
): Promise<FleetBoardVehicle[]> {
  const [vehicles, activeTrips] = await Promise.all([
    getVehicles(supabase),
    getActiveTrips(supabase),
  ]);

  return buildFleetBoard(vehicles, activeTrips);
}

export interface FleetSummary {
  total: number;
  onTrip: number;
  available: number;
  maintenance: number;
  offline: number;
  activeTrips: number;
}

/** Pure aggregation over an already-fetched fleet board -- no query of its own. */
export function summarizeFleet(board: FleetBoardVehicle[]): FleetSummary {
  const summary: FleetSummary = {
    total: board.length,
    onTrip: 0,
    available: 0,
    maintenance: 0,
    offline: 0,
    activeTrips: 0,
  };

  for (const vehicle of board) {
    if (vehicle.activeTrip) summary.activeTrips += 1;
    switch (vehicle.operationalStatus) {
      case "ON_TRIP":
        summary.onTrip += 1;
        break;
      case "AVAILABLE":
        summary.available += 1;
        break;
      case "MAINTENANCE":
        summary.maintenance += 1;
        break;
      case "OFFLINE":
        summary.offline += 1;
        break;
    }
  }

  return summary;
}
