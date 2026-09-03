/**
 * Approximate coordinates for the towns and cities that show up in FleetOS
 * trip origins/destinations and stops. This exists for one purpose: turning
 * a free-text location string into a point we can compare a GPS fix
 * against, so we can surface a "possible arrival" advisory. It is not a
 * geocoder -- unmatched names simply produce no advisory, which is the
 * correct, honest behavior rather than guessing a location.
 */
export const ETHIOPIA_CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  "addis ababa": { lat: 9.0192, lng: 38.7525 },
  "adama": { lat: 8.54, lng: 39.2694 },
  "nazret": { lat: 8.54, lng: 39.2694 },
  "dire dawa": { lat: 9.5931, lng: 41.8661 },
  "djibouti": { lat: 11.5721, lng: 43.1456 },
  "djibouti city": { lat: 11.5721, lng: 43.1456 },
  "modjo": { lat: 8.6, lng: 39.1167 },
  "mojo": { lat: 8.6, lng: 39.1167 },
  "awash": { lat: 8.9833, lng: 40.1667 },
  "bishoftu": { lat: 8.7833, lng: 38.9833 },
  "debre zeit": { lat: 8.7833, lng: 38.9833 },
  "hawassa": { lat: 7.0504, lng: 38.4955 },
  "awasa": { lat: 7.0504, lng: 38.4955 },
  "bahir dar": { lat: 11.5936, lng: 37.3908 },
  "gondar": { lat: 12.6, lng: 37.4667 },
  "mekelle": { lat: 13.4967, lng: 39.4753 },
  "jimma": { lat: 7.6733, lng: 36.8358 },
  "dessie": { lat: 11.1333, lng: 39.6333 },
  "combolcha": { lat: 11.0833, lng: 39.75 },
  "kombolcha": { lat: 11.0833, lng: 39.75 },
  "shashamane": { lat: 7.2, lng: 38.6 },
  "ambo": { lat: 8.9833, lng: 37.85 },
  "nekemte": { lat: 9.0833, lng: 36.55 },
  "assosa": { lat: 10.0667, lng: 34.5333 },
  "semera": { lat: 11.7833, lng: 41.0167 },
  "harar": { lat: 9.3111, lng: 42.1181 },
  "jijiga": { lat: 9.35, lng: 42.8 },
  "arba minch": { lat: 6.0333, lng: 37.55 },
  "gambela": { lat: 8.25, lng: 34.5833 },
  "debre birhan": { lat: 9.6789, lng: 39.5311 },
  "debre markos": { lat: 10.35, lng: 37.7333 },
  "adigrat": { lat: 14.2789, lng: 39.4622 },
  "moyale": { lat: 3.5333, lng: 39.05 },
};

function normalizeLocationName(location: string): string {
  return location.trim().toLowerCase();
}

/** Looks up a free-text location string against the known city table. Returns null for anything unrecognized. */
export function lookupCityCoordinate(location: string | null | undefined): { lat: number; lng: number } | null {
  if (!location) return null;
  return ETHIOPIA_CITY_COORDINATES[normalizeLocationName(location)] ?? null;
}
