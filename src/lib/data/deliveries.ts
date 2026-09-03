import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { EXCEPTION_DELIVERY_STATUSES } from "@/lib/domain/delivery";
import type { DeliveryStatus } from "@/lib/domain/delivery";
import type { Database } from "@/lib/supabase/database.types";

const DELIVERY_SELECT =
  "*, trip:trips(id, trip_number, vehicle_id, vehicle:vehicles(id, unit_number), driver:drivers(id, full_name)), client:clients(id, name), trip_stop:trip_stops(id, location)";

export type DeliveryListItem = Database["public"]["Tables"]["deliveries"]["Row"] & {
  trip:
    | (Pick<Database["public"]["Tables"]["trips"]["Row"], "id" | "trip_number" | "vehicle_id"> & {
        vehicle: Pick<Database["public"]["Tables"]["vehicles"]["Row"], "id" | "unit_number"> | null;
        driver: Pick<Database["public"]["Tables"]["drivers"]["Row"], "id" | "full_name"> | null;
      })
    | null;
  client: Pick<Database["public"]["Tables"]["clients"]["Row"], "id" | "name"> | null;
  trip_stop: Pick<Database["public"]["Tables"]["trip_stops"]["Row"], "id" | "location"> | null;
};

export type DeliveryDetail = DeliveryListItem;

export interface DeliveryFilters {
  status?: DeliveryStatus;
  tripId?: string;
  /** Matches against delivery_number, reference_number, recipient_name (case-insensitive). */
  search?: string;
}

/** The `/deliveries` list query -- every delivery in the caller's organization with its trip/vehicle/client attached. */
export async function getDeliveries(
  supabase: SupabaseClient<Database>,
  filters: DeliveryFilters = {},
): Promise<DeliveryListItem[]> {
  let query = supabase
    .from("deliveries")
    .select(DELIVERY_SELECT)
    .order("scheduled_at", { ascending: false, nullsFirst: false });

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.tripId) query = query.eq("trip_id", filters.tripId);
  if (filters.search) {
    const term = filters.search.trim();
    if (term.length > 0) {
      const escaped = term.replace(/[%_]/g, (c) => `\\${c}`);
      query = query.or(
        `delivery_number.ilike.%${escaped}%,reference_number.ilike.%${escaped}%,recipient_name.ilike.%${escaped}%`,
      );
    }
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to load deliveries: ${error.message}`);
  }
  return data;
}

/** Every delivery that belongs to one trip, in stop order -- the Trip Detail deliveries list reads this. */
export async function getDeliveriesByTripId(
  supabase: SupabaseClient<Database>,
  tripId: string,
): Promise<DeliveryListItem[]> {
  const { data, error } = await supabase
    .from("deliveries")
    .select(DELIVERY_SELECT)
    .eq("trip_id", tripId)
    .order("scheduled_at", { ascending: true, nullsFirst: false });

  if (error) {
    throw new Error(`Failed to load trip deliveries: ${error.message}`);
  }
  return data;
}

export interface DeliverySummary {
  total: number;
  pending: number;
  inTransit: number;
  delivered: number;
  exceptions: number;
}

/** Counts for the `/deliveries` summary cards, mirroring `getTripSummary`'s one-query-per-count shape. */
export async function getDeliverySummary(
  supabase: SupabaseClient<Database>,
): Promise<DeliverySummary> {
  const [totalRes, pendingRes, inTransitRes, deliveredRes, exceptionsRes] = await Promise.all([
    supabase.from("deliveries").select("id", { count: "exact", head: true }),
    supabase.from("deliveries").select("id", { count: "exact", head: true }).eq("status", "PENDING"),
    supabase.from("deliveries").select("id", { count: "exact", head: true }).eq("status", "IN_TRANSIT"),
    supabase.from("deliveries").select("id", { count: "exact", head: true }).eq("status", "DELIVERED"),
    supabase
      .from("deliveries")
      .select("id", { count: "exact", head: true })
      .in("status", EXCEPTION_DELIVERY_STATUSES),
  ]);

  for (const res of [totalRes, pendingRes, inTransitRes, deliveredRes, exceptionsRes]) {
    if (res.error) throw new Error(`Failed to load delivery summary: ${res.error.message}`);
  }

  return {
    total: totalRes.count ?? 0,
    pending: pendingRes.count ?? 0,
    inTransit: inTransitRes.count ?? 0,
    delivered: deliveredRes.count ?? 0,
    exceptions: exceptionsRes.count ?? 0,
  };
}

/** Single-delivery read for the Delivery Detail page. Returns null if not found (or not in the caller's org, via RLS). */
export async function getDeliveryById(
  supabase: SupabaseClient<Database>,
  deliveryId: string,
): Promise<DeliveryDetail | null> {
  const { data, error } = await supabase
    .from("deliveries")
    .select(DELIVERY_SELECT)
    .eq("id", deliveryId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load delivery: ${error.message}`);
  }
  return data;
}
