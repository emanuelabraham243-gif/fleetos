import type { Database } from "@/lib/supabase/database.types";

export type TripStatus = Database["public"]["Enums"]["trip_status"];

/**
 * Statuses that mean "this trip is currently happening" -- used to decide
 * whether a vehicle counts as ON_TRIP and to filter the Active Trips list.
 * Language-neutral tokens throughout; never compare against display text.
 */
export const ACTIVE_TRIP_STATUSES: readonly TripStatus[] = [
  "ASSIGNED",
  "LOADING",
  "DISPATCHED",
  "IN_TRANSIT",
  "ARRIVED",
];

export function isActiveTripStatus(status: TripStatus): boolean {
  return ACTIVE_TRIP_STATUSES.includes(status);
}
