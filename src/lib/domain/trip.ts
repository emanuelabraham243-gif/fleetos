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

/**
 * The trip lifecycle is a strict forward sequence -- a dispatcher cannot
 * pick an arbitrary status off a dropdown, because that could make the
 * operational history (and everything that reads it: audit trail, GPS
 * correlation, financials) inconsistent. From any non-terminal status the
 * only allowed moves are the next status in sequence or an explicit
 * cancellation; CANCELLED and COMPLETED are terminal (no transitions out).
 */
export const ALLOWED_TRANSITIONS: Record<TripStatus, readonly TripStatus[]> = {
  DRAFT: ["ASSIGNED", "CANCELLED"],
  ASSIGNED: ["LOADING", "CANCELLED"],
  LOADING: ["DISPATCHED", "CANCELLED"],
  DISPATCHED: ["IN_TRANSIT", "CANCELLED"],
  IN_TRANSIT: ["ARRIVED", "CANCELLED"],
  ARRIVED: ["DELIVERED", "CANCELLED"],
  DELIVERED: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export function canTransition(from: TripStatus, to: TripStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

/** Every status a trip could legally move to next, for building action buttons. */
export function nextTripStatuses(from: TripStatus): readonly TripStatus[] {
  return ALLOWED_TRANSITIONS[from];
}

export function isTerminalTripStatus(status: TripStatus): boolean {
  return ALLOWED_TRANSITIONS[status].length === 0;
}
