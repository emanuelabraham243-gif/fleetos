import type { Database } from "@/lib/supabase/database.types";

export type DeliveryStatus = Database["public"]["Enums"]["delivery_status"];

/**
 * A delivery's outcome is not binary. Real-world exceptions are first-class
 * statuses, not a boolean "delivered" flag: a customer can accept part of a
 * load, refuse it outright, or the cargo can arrive damaged -- each keeps
 * both the expected and delivered quantity on record rather than collapsing
 * them into "success/failure". None of these statuses assign fault; that is
 * what disputes and incident evidence are for.
 */
export const ALLOWED_DELIVERY_TRANSITIONS: Record<DeliveryStatus, readonly DeliveryStatus[]> = {
  PENDING: ["IN_TRANSIT", "CANCELLED"],
  IN_TRANSIT: ["ARRIVED", "CANCELLED"],
  ARRIVED: ["DELIVERED", "PARTIALLY_DELIVERED", "REFUSED", "DAMAGED", "CANCELLED"],
  DELIVERED: [],
  PARTIALLY_DELIVERED: [],
  REFUSED: [],
  DAMAGED: [],
  CANCELLED: [],
};

export function canTransitionDelivery(from: DeliveryStatus, to: DeliveryStatus): boolean {
  return ALLOWED_DELIVERY_TRANSITIONS[from].includes(to);
}

export function nextDeliveryStatuses(from: DeliveryStatus): readonly DeliveryStatus[] {
  return ALLOWED_DELIVERY_TRANSITIONS[from];
}

export function isTerminalDeliveryStatus(status: DeliveryStatus): boolean {
  return ALLOWED_DELIVERY_TRANSITIONS[status].length === 0;
}

/** Statuses where a delivery diverged from plan -- these are what a dispute or evidence review starts from. */
export const EXCEPTION_DELIVERY_STATUSES: readonly DeliveryStatus[] = [
  "PARTIALLY_DELIVERED",
  "REFUSED",
  "DAMAGED",
];

export function isExceptionDeliveryStatus(status: DeliveryStatus): boolean {
  return EXCEPTION_DELIVERY_STATUSES.includes(status);
}
