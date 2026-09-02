import type { GpsStatus } from "@/lib/gps/status";
import type { Database } from "@/lib/supabase/database.types";

export type VehicleStatus = Database["public"]["Tables"]["vehicles"]["Row"]["status"];

/**
 * The fleet-summary status a dispatcher actually wants ("is this truck
 * usable right now"), computed from the vehicle's own lifecycle status,
 * whether it's currently on a trip, and how fresh its GPS is. This is
 * never stored -- it's derived fresh every time from data that already
 * has one source of truth (vehicles.status, trips, vehicle_locations).
 */
export type VehicleOperationalStatus = "ON_TRIP" | "AVAILABLE" | "MAINTENANCE" | "OFFLINE";

/**
 * A vehicle whose GPS hasn't reported recently (OFFLINE) or has never
 * reported (UNKNOWN) is bucketed as OFFLINE here: dispatch can't currently
 * account for it, which is the fact this status communicates -- it does
 * not mean the vehicle itself is broken down.
 */
export function computeVehicleOperationalStatus(
  vehicleStatus: VehicleStatus,
  hasActiveTrip: boolean,
  gpsStatus: GpsStatus,
): VehicleOperationalStatus {
  if (vehicleStatus === "maintenance" || vehicleStatus === "out_of_service") {
    return "MAINTENANCE";
  }
  if (hasActiveTrip) {
    return "ON_TRIP";
  }
  if (gpsStatus === "offline" || gpsStatus === "unknown") {
    return "OFFLINE";
  }
  return "AVAILABLE";
}

/**
 * A finer-grained status for the Vehicles list filter, built on top of
 * `computeVehicleOperationalStatus` rather than duplicating its logic --
 * the Command Center's 4-bucket summary is unaffected. IDLE splits out an
 * AVAILABLE vehicle whose engine is running but not moving (from the
 * latest GPS fix's movement_state); INACTIVE splits out vehicles retired
 * from the fleet (sold/retired), which the 4-bucket model folds nowhere.
 */
export type VehicleListStatus = VehicleOperationalStatus | "IDLE" | "INACTIVE";

export function deriveVehicleListStatus(
  vehicleStatus: VehicleStatus,
  operationalStatus: VehicleOperationalStatus,
  movementState: Database["public"]["Enums"]["movement_state"] | null | undefined,
): VehicleListStatus {
  if (vehicleStatus === "sold" || vehicleStatus === "retired") {
    return "INACTIVE";
  }
  if (operationalStatus === "AVAILABLE" && movementState === "idle") {
    return "IDLE";
  }
  return operationalStatus;
}
