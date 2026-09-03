import type { Database } from "@/lib/supabase/database.types";

export type TripStopStatus = Database["public"]["Enums"]["trip_stop_status"];
export type TripStopType = Database["public"]["Enums"]["trip_stop_type"];

export const ACTIVE_TRIP_STOP_STATUSES: readonly TripStopStatus[] = ["ARRIVED", "IN_PROGRESS"];

export function isActiveTripStopStatus(status: TripStopStatus): boolean {
  return ACTIVE_TRIP_STOP_STATUSES.includes(status);
}
