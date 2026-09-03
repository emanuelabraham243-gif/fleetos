import type { TripStatus } from "@/lib/domain/trip";
import type { Database } from "@/lib/supabase/database.types";

export type DriverStatus = Database["public"]["Enums"]["driver_status"];

/**
 * `status` is an administrative fact (an authorized decision was recorded --
 * hired, put on leave, suspended, terminated). It is never inferred from a
 * GPS anomaly or a bad delivery outcome; only a Server Action driven by a
 * user with permission ever writes it.
 */
export const DRIVER_STATUSES: readonly DriverStatus[] = [
  "ACTIVE",
  "INACTIVE",
  "ON_LEAVE",
  "SUSPENDED",
  "TERMINATED",
];

export type DriverOperationalState =
  | "AVAILABLE"
  | "ON_TRIP"
  | "LOADING"
  | "ARRIVED"
  | "OFF_DUTY"
  | "ON_LEAVE"
  | "INACTIVE"
  | "UNKNOWN";

/**
 * "What is this driver doing right now" is derived, never a second stored
 * status column -- one source of truth (the administrative `status` plus
 * whatever trip, if any, they're currently assigned to). `OFF_DUTY` is part
 * of the type for when a shift/clock-in system exists to justify it; until
 * then it is never derived, matching the "don't fabricate a state the data
 * can't support" rule everywhere else in FleetOS.
 */
export function deriveDriverOperationalState(
  status: DriverStatus,
  activeTripStatus: TripStatus | null,
): DriverOperationalState {
  if (status === "ON_LEAVE") return "ON_LEAVE";
  if (status === "INACTIVE" || status === "SUSPENDED" || status === "TERMINATED") {
    return "INACTIVE";
  }
  if (status !== "ACTIVE") return "UNKNOWN";

  if (!activeTripStatus) return "AVAILABLE";

  switch (activeTripStatus) {
    case "LOADING":
      return "LOADING";
    case "DISPATCHED":
    case "IN_TRANSIT":
      return "ON_TRIP";
    case "ARRIVED":
    case "DELIVERED":
      return "ARRIVED";
    case "ASSIGNED":
      return "AVAILABLE";
    default:
      return "AVAILABLE";
  }
}
