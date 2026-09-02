import { mockGpsProvider } from "@/lib/gps/providers/mock";
import type { GpsProvider } from "@/lib/gps/types";

/**
 * Every adapter FleetOS ships with, keyed by the `gps_providers.slug` it
 * implements. Swapping in a real vendor later means writing one more
 * adapter and adding it here -- nothing else in the app changes.
 */
const providers: Record<string, GpsProvider> = {
  mock: mockGpsProvider,
};

export function getGpsProvider(slug: string): GpsProvider | undefined {
  return providers[slug];
}

export function registeredProviderSlugs(): string[] {
  return Object.keys(providers);
}
