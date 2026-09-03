import { isActiveTripStatus } from "@/lib/domain/trip";
import type { TripListItem } from "@/lib/data/trips";
import type { DeliveryListItem } from "@/lib/data/deliveries";
import type { DriverIncident } from "@/lib/data/incidents";

export interface DriverOperationalMetrics {
  completedTrips: number;
  activeTrips: number;
  completedDeliveries: number;
  partiallyDeliveredDeliveries: number;
  refusedDeliveries: number;
  damagedDeliveries: number;
  incidentCount: number;
  /** null when no completed trip on record has a distance recorded -- never a guessed figure. */
  totalDistanceKm: number | null;
}

/**
 * Plain counts over data the caller already fetched -- no query of its own,
 * same "pure combine" shape as `summarizeFleet`/`getTripFinancialSummary`.
 * Deliberately NOT a single combined "score": each number is one fact,
 * shown with its own label, so nothing here ranks or judges a driver.
 */
export function computeDriverMetrics(
  trips: TripListItem[],
  deliveries: DeliveryListItem[],
  incidents: DriverIncident[],
): DriverOperationalMetrics {
  const completedTrips = trips.filter((trip) => trip.status === "COMPLETED").length;
  const activeTrips = trips.filter((trip) => isActiveTripStatus(trip.status)).length;

  const completedDeliveries = deliveries.filter((d) => d.status === "DELIVERED").length;
  const partiallyDeliveredDeliveries = deliveries.filter(
    (d) => d.status === "PARTIALLY_DELIVERED",
  ).length;
  const refusedDeliveries = deliveries.filter((d) => d.status === "REFUSED").length;
  const damagedDeliveries = deliveries.filter((d) => d.status === "DAMAGED").length;

  const distances = trips
    .filter((trip) => trip.status === "COMPLETED" && trip.distance_km !== null)
    .map((trip) => Number(trip.distance_km));
  const totalDistanceKm = distances.length > 0 ? distances.reduce((a, b) => a + b, 0) : null;

  return {
    completedTrips,
    activeTrips,
    completedDeliveries,
    partiallyDeliveredDeliveries,
    refusedDeliveries,
    damagedDeliveries,
    incidentCount: incidents.length,
    totalDistanceKm,
  };
}
