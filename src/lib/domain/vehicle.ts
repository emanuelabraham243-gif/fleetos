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
