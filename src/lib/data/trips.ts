import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { ACTIVE_TRIP_STATUSES } from "@/lib/domain/trip";
import type { TripStatus } from "@/lib/domain/trip";
import type { Database } from "@/lib/supabase/database.types";

export type ActiveTrip = Database["public"]["Tables"]["trips"]["Row"] & {
  vehicle: Pick<Database["public"]["Tables"]["vehicles"]["Row"], "id" | "unit_number"> | null;
  driver: Pick<Database["public"]["Tables"]["drivers"]["Row"], "id" | "full_name"> | null;
};

const TRIP_LIST_SELECT =
  "*, vehicle:vehicles(id, unit_number), driver:drivers(id, full_name), client:clients(id, name)";

export type TripListItem = Database["public"]["Tables"]["trips"]["Row"] & {
  vehicle: Pick<Database["public"]["Tables"]["vehicles"]["Row"], "id" | "unit_number"> | null;
  driver: Pick<Database["public"]["Tables"]["drivers"]["Row"], "id" | "full_name"> | null;
  client: Pick<Database["public"]["Tables"]["clients"]["Row"], "id" | "name"> | null;
};

export type TripDetail = TripListItem;

export interface TripFilters {
  status?: TripStatus;
  vehicleId?: string;
  driverId?: string;
  /** Matches against trip_number, reference_number, origin, destination (case-insensitive). */
  search?: string;
}

/**
 * The `/trips` list query -- every trip in the caller's organization
 * (RLS-scoped) with the vehicle/driver/client it's assigned to, newest
 * scheduled first. Filters are applied server-side so the table, search
 * box, and status chips all read from the same query shape.
 */
export async function getTrips(
  supabase: SupabaseClient<Database>,
  filters: TripFilters = {},
): Promise<TripListItem[]> {
  let query = supabase
    .from("trips")
    .select(TRIP_LIST_SELECT)
    .order("scheduled_start", { ascending: false, nullsFirst: false });

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.vehicleId) query = query.eq("vehicle_id", filters.vehicleId);
  if (filters.driverId) query = query.eq("driver_id", filters.driverId);
  if (filters.search) {
    const term = filters.search.trim();
    if (term.length > 0) {
      const escaped = term.replace(/[%_]/g, (c) => `\\${c}`);
      query = query.or(
        `trip_number.ilike.%${escaped}%,reference_number.ilike.%${escaped}%,origin.ilike.%${escaped}%,destination.ilike.%${escaped}%`,
      );
    }
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to load trips: ${error.message}`);
  }
  return data;
}

/**
 * The Dispatch board's query: every trip that's still operationally open
 * (not yet COMPLETED or CANCELLED), regardless of when it was scheduled --
 * a trip a dispatcher forgot to close out yesterday still needs to be
 * visible today, not silently dropped off the board by a date filter.
 */
export async function getDispatchTrips(supabase: SupabaseClient<Database>): Promise<TripListItem[]> {
  const { data, error } = await supabase
    .from("trips")
    .select(TRIP_LIST_SELECT)
    .not("status", "in", "(COMPLETED,CANCELLED)")
    .order("scheduled_start", { ascending: true, nullsFirst: false });

  if (error) {
    throw new Error(`Failed to load dispatch board trips: ${error.message}`);
  }
  return data;
}

export interface TripSummary {
  total: number;
  active: number;
  draft: number;
  deliveredToday: number;
  cancelled: number;
}

/**
 * Counts for the `/trips` summary cards. Each count is its own query
 * rather than one query post-filtered in JS, so the counts stay accurate
 * even as the trips table grows past what a single page fetches.
 */
export async function getTripSummary(supabase: SupabaseClient<Database>): Promise<TripSummary> {
  const startOfTodayUtc = new Date();
  startOfTodayUtc.setUTCHours(0, 0, 0, 0);

  const [totalRes, activeRes, draftRes, deliveredTodayRes, cancelledRes] = await Promise.all([
    supabase.from("trips").select("id", { count: "exact", head: true }),
    supabase.from("trips").select("id", { count: "exact", head: true }).in("status", ACTIVE_TRIP_STATUSES),
    supabase.from("trips").select("id", { count: "exact", head: true }).eq("status", "DRAFT"),
    supabase
      .from("trips")
      .select("id", { count: "exact", head: true })
      .eq("status", "DELIVERED")
      .gte("actual_end", startOfTodayUtc.toISOString()),
    supabase.from("trips").select("id", { count: "exact", head: true }).eq("status", "CANCELLED"),
  ]);

  for (const res of [totalRes, activeRes, draftRes, deliveredTodayRes, cancelledRes]) {
    if (res.error) throw new Error(`Failed to load trip summary: ${res.error.message}`);
  }

  return {
    total: totalRes.count ?? 0,
    active: activeRes.count ?? 0,
    draft: draftRes.count ?? 0,
    deliveredToday: deliveredTodayRes.count ?? 0,
    cancelled: cancelledRes.count ?? 0,
  };
}

/** Single-trip read for the Trip Detail page. Returns null if not found (or not in the caller's org, via RLS). */
export async function getTripById(
  supabase: SupabaseClient<Database>,
  tripId: string,
): Promise<TripDetail | null> {
  const { data, error } = await supabase
    .from("trips")
    .select(TRIP_LIST_SELECT)
    .eq("id", tripId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load trip: ${error.message}`);
  }
  return data;
}

export interface TripConflict {
  tripId: string;
  tripNumber: string;
  status: TripStatus;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  conflictsOn: ("vehicle" | "driver")[];
}

/**
 * Double-booking check for the New Trip form: does this vehicle or driver
 * already have a non-cancelled, non-completed trip whose scheduled window
 * overlaps the one being created? Two windows overlap when each starts
 * before the other ends -- a trip with no scheduled_end is treated as
 * open-ended for this check, since we can't prove it doesn't conflict.
 */
export async function findTripConflicts(
  supabase: SupabaseClient<Database>,
  params: {
    vehicleId: string;
    driverId: string | null;
    scheduledStart: string;
    scheduledEnd: string | null;
    excludeTripId?: string;
  },
): Promise<TripConflict[]> {
  const orParts = [`vehicle_id.eq.${params.vehicleId}`];
  if (params.driverId) orParts.push(`driver_id.eq.${params.driverId}`);

  let query = supabase
    .from("trips")
    .select("id, trip_number, status, vehicle_id, driver_id, scheduled_start, scheduled_end")
    .not("status", "in", "(CANCELLED,COMPLETED)")
    .or(orParts.join(","));

  if (params.excludeTripId) query = query.neq("id", params.excludeTripId);

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to check trip conflicts: ${error.message}`);
  }

  const newStart = new Date(params.scheduledStart).getTime();
  const newEnd = params.scheduledEnd ? new Date(params.scheduledEnd).getTime() : null;

  const conflicts: TripConflict[] = [];
  for (const row of data ?? []) {
    if (!row.scheduled_start) continue;
    const existingStart = new Date(row.scheduled_start).getTime();
    const existingEnd = row.scheduled_end ? new Date(row.scheduled_end).getTime() : null;

    const startsBeforeOtherEnds = existingEnd === null || newStart < existingEnd;
    const endsAfterOtherStarts = newEnd === null || existingStart < newEnd;
    if (!startsBeforeOtherEnds || !endsAfterOtherStarts) continue;

    const conflictsOn: ("vehicle" | "driver")[] = [];
    if (row.vehicle_id === params.vehicleId) conflictsOn.push("vehicle");
    if (params.driverId && row.driver_id === params.driverId) conflictsOn.push("driver");
    if (conflictsOn.length === 0) continue;

    conflicts.push({
      tripId: row.id,
      tripNumber: row.trip_number,
      status: row.status,
      scheduledStart: row.scheduled_start,
      scheduledEnd: row.scheduled_end,
      conflictsOn,
    });
  }

  return conflicts;
}

/**
 * Every trip currently in progress (ASSIGNED through ARRIVED -- see
 * ACTIVE_TRIP_STATUSES), with its vehicle and driver attached. This is the
 * single query both the Active Trips section and the fleet board's
 * per-vehicle "current trip" lookup read from -- neither re-queries trips
 * on its own.
 */
export async function getActiveTrips(
  supabase: SupabaseClient<Database>,
): Promise<ActiveTrip[]> {
  const { data, error } = await supabase
    .from("trips")
    .select("*, vehicle:vehicles(id, unit_number), driver:drivers(id, full_name)")
    .in("status", ACTIVE_TRIP_STATUSES)
    .order("actual_start", { ascending: false, nullsFirst: false });

  if (error) {
    throw new Error(`Failed to load active trips: ${error.message}`);
  }

  return data;
}
