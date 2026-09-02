import type {
  GpsProvider,
  GpsProviderContext,
  MovementState,
  NormalizedGpsEvent,
} from "@/lib/gps/types";

/**
 * Deterministic simulated GPS feed. Each registered device is assigned a
 * small closed loop of waypoints (seeded from its device id, so the same
 * device always drives the same route); `fetchEvents` returns where that
 * device is *right now* by interpolating along the loop based on the
 * current time. No external state, no randomness that can't be
 * reproduced -- calling it twice a second apart advances the vehicle
 * along its route exactly as it would in reality.
 */

const LAP_DURATION_MS = 20 * 60 * 1000; // one full loop every 20 minutes
const AVERAGE_SPEED_KPH = 55;
const ROUTE_RADIUS_DEGREES = 0.045; // ~5km loop radius

function hashSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function deviceBaseCoordinate(externalDeviceId: string): { lat: number; lng: number } {
  // Hash lat/lng independently -- device ids that differ by one trailing
  // character (MOCK-101 vs MOCK-102) would otherwise produce near-identical
  // seeds and cluster every demo vehicle on top of each other.
  const latSeed = hashSeed(`${externalDeviceId}:lat`);
  const lngSeed = hashSeed(`${externalDeviceId}:lng`);
  // Spread demo vehicles around a single metro area rather than the globe.
  const lat = 39.75 + ((latSeed % 1000) / 1000 - 0.5) * 0.3;
  const lng = -104.99 + ((lngSeed % 1000) / 1000 - 0.5) * 0.3;
  return { lat, lng };
}

function movementStateFor(speedKph: number): MovementState {
  if (speedKph < 1) return "stationary";
  if (speedKph < 8) return "idle";
  return "moving";
}

export const mockGpsProvider: GpsProvider = {
  slug: "mock",

  async fetchEvents(context: GpsProviderContext): Promise<NormalizedGpsEvent[]> {
    const externalDeviceId = context.config.externalDeviceId;
    if (typeof externalDeviceId !== "string") {
      throw new Error(
        "mockGpsProvider.fetchEvents requires context.config.externalDeviceId",
      );
    }

    const now = Date.now();
    const base = deviceBaseCoordinate(externalDeviceId);
    const seed = hashSeed(externalDeviceId);

    // Position along the loop, offset per-device so vehicles aren't in lockstep.
    const phaseOffset = (seed % LAP_DURATION_MS) / LAP_DURATION_MS;
    const progress = ((now / LAP_DURATION_MS) % 1) + phaseOffset;
    const angle = progress * 2 * Math.PI;

    const latitude = base.lat + Math.sin(angle) * ROUTE_RADIUS_DEGREES;
    const longitude = base.lng + Math.cos(angle) * ROUTE_RADIUS_DEGREES * 1.3;

    // Heading = tangent to the loop at this point.
    const headingRad = angle + Math.PI / 2;
    const headingDegrees = ((headingRad * 180) / Math.PI + 360) % 360;

    // Speed varies smoothly around the average so it isn't a flat line.
    const speedKph = Math.max(
      0,
      AVERAGE_SPEED_KPH + Math.sin(angle * 3) * 15 + ((seed % 7) - 3),
    );

    const odometerKm = (seed % 50000) + (now / (1000 * 60 * 60)) * 0.5;

    const event: NormalizedGpsEvent = {
      externalDeviceId,
      recordedAt: new Date(now).toISOString(),
      latitude,
      longitude,
      speedKph: Math.round(speedKph * 10) / 10,
      headingDegrees: Math.round(headingDegrees * 10) / 10,
      ignitionOn: speedKph > 0.5,
      odometerKm: Math.round(odometerKm * 10) / 10,
      movementState: movementStateFor(speedKph),
      rawPayload: {
        source: "mock-gps-provider",
        externalDeviceId,
        generatedAt: new Date(now).toISOString(),
      },
    };

    return [event];
  },
};
