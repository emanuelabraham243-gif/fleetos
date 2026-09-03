import { lookupCityCoordinate } from "@/lib/geo/ethiopia-cities";

/**
 * Single source of truth for "how close counts as close" -- mirrors the
 * pattern in gps/config.ts. This threshold only ever drives an advisory
 * banner a dispatcher can act on; it must never be used to change a trip's
 * or delivery's status automatically.
 */
export const ARRIVAL_PROXIMITY_THRESHOLDS = {
  /** A GPS fix within this many km of the destination may indicate arrival. */
  possibleArrivalRadiusKm: 5,
  /** A fix older than this is too stale to base an arrival advisory on. */
  maxFixAgeMsForAdvisory: 20 * 60 * 1000,
} as const;

function haversineDistanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const earthRadiusKm = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(h));
}

/**
 * Purely an advisory hint for a dispatcher -- "the vehicle's last known
 * position is close to the destination, you may want to confirm arrival."
 * This NEVER transitions a trip's status itself: GPS proximity is
 * circumstantial (a device can be near a destination without the driver
 * actually being done, or vice versa near a shared corridor), so the
 * decision always stays a manual, explicit action.
 */
export function detectPossibleArrival(params: {
  destination: string | null;
  vehicleLocation: { lat: number; lng: number; recordedAt: string } | null;
  now?: Date;
}): { isPossibleArrival: boolean; distanceKm: number | null } {
  const { destination, vehicleLocation, now = new Date() } = params;

  const destinationCoordinate = lookupCityCoordinate(destination);
  if (!destinationCoordinate || !vehicleLocation) {
    return { isPossibleArrival: false, distanceKm: null };
  }

  const fixAgeMs = now.getTime() - new Date(vehicleLocation.recordedAt).getTime();
  if (fixAgeMs < 0 || fixAgeMs > ARRIVAL_PROXIMITY_THRESHOLDS.maxFixAgeMsForAdvisory) {
    return { isPossibleArrival: false, distanceKm: null };
  }

  const distanceKm = haversineDistanceKm(destinationCoordinate, {
    lat: vehicleLocation.lat,
    lng: vehicleLocation.lng,
  });

  return {
    isPossibleArrival: distanceKm <= ARRIVAL_PROXIMITY_THRESHOLDS.possibleArrivalRadiusKm,
    distanceKm,
  };
}
