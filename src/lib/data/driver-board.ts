import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { deriveDriverOperationalState, type DriverOperationalState } from "@/lib/domain/driver";
import { computeDocumentStatus } from "@/lib/domain/document";
import type { Database } from "@/lib/supabase/database.types";

import { getCurrentAssignmentsByDriver, type DriverAssignmentByDriver } from "./driver-assignments";
import { getDriverDocumentExpiryDates } from "./driver-documents";
import { getDrivers, type Driver } from "./drivers";
import { getActiveTrips, type ActiveTrip } from "./trips";

export interface DriverBoardEntry extends Driver {
  operationalState: DriverOperationalState;
  activeTrip: ActiveTrip | null;
  currentVehicle: { id: string; unit_number: string } | null;
  currentAssignment: DriverAssignmentByDriver | null;
  hasExpiringOrExpiredDocument: boolean;
}

/**
 * Pure combine step -- no query of its own, mirrors `buildFleetBoard`. A
 * driver's current vehicle/trip/operational state is always derived from
 * the trip and assignment tables that are the real source of truth, never
 * duplicated onto the driver row itself.
 */
export function buildDriverBoard(
  drivers: Driver[],
  activeTrips: ActiveTrip[],
  currentAssignments: Map<string, DriverAssignmentByDriver>,
  documentExpiryFlagByDriverId: Map<string, boolean>,
): DriverBoardEntry[] {
  const activeTripByDriverId = new Map(
    activeTrips.filter((trip) => trip.driver_id).map((trip) => [trip.driver_id as string, trip]),
  );

  return drivers.map((driver) => {
    const activeTrip = activeTripByDriverId.get(driver.id) ?? null;
    const currentAssignment = currentAssignments.get(driver.id) ?? null;
    const operationalState = deriveDriverOperationalState(driver.status, activeTrip?.status ?? null);
    const currentVehicle = activeTrip?.vehicle ?? currentAssignment?.vehicle ?? null;

    return {
      ...driver,
      operationalState,
      activeTrip,
      currentVehicle,
      currentAssignment,
      hasExpiringOrExpiredDocument: documentExpiryFlagByDriverId.get(driver.id) ?? false,
    };
  });
}

/** Convenience wrapper for the `/drivers` list page -- one fetch, four small queries combined. */
export async function getDriverBoard(supabase: SupabaseClient<Database>): Promise<DriverBoardEntry[]> {
  const [drivers, activeTrips, currentAssignments] = await Promise.all([
    getDrivers(supabase),
    getActiveTrips(supabase),
    getCurrentAssignmentsByDriver(supabase),
  ]);

  const expiryDatesByDriver = await Promise.all(
    drivers.map((driver) => getDriverDocumentExpiryDates(supabase, driver.id)),
  );
  const documentExpiryFlagByDriverId = new Map(
    drivers.map((driver, index) => {
      const flagged = expiryDatesByDriver[index].some((expiresAt) => {
        const status = computeDocumentStatus(expiresAt);
        return status === "EXPIRING_SOON" || status === "EXPIRED";
      });
      return [driver.id, flagged] as const;
    }),
  );

  return buildDriverBoard(drivers, activeTrips, currentAssignments, documentExpiryFlagByDriverId);
}

export interface DriverSummary {
  total: number;
  active: number;
  assigned: number;
  available: number;
  onTrip: number;
  inactive: number;
  documentsExpiring: number;
}

/** Pure aggregation over an already-fetched driver board -- no query of its own. */
export function summarizeDrivers(board: DriverBoardEntry[]): DriverSummary {
  const summary: DriverSummary = {
    total: board.length,
    active: 0,
    assigned: 0,
    available: 0,
    onTrip: 0,
    inactive: 0,
    documentsExpiring: 0,
  };

  for (const driver of board) {
    if (driver.status === "ACTIVE") summary.active += 1;
    if (driver.currentAssignment) summary.assigned += 1;
    if (driver.operationalState === "AVAILABLE") summary.available += 1;
    if (driver.operationalState === "ON_TRIP" || driver.operationalState === "LOADING" || driver.operationalState === "ARRIVED") {
      summary.onTrip += 1;
    }
    if (driver.operationalState === "INACTIVE") summary.inactive += 1;
    if (driver.hasExpiringOrExpiredDocument) summary.documentsExpiring += 1;
  }

  return summary;
}
