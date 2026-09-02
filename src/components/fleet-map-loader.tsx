"use client";

import dynamic from "next/dynamic";

import { Skeleton } from "@/components/ui/skeleton";
import type { FleetMapVehicle } from "./fleet-map";

// Leaflet touches `window` at import time, so it can only ever run in the
// browser -- `ssr: false` is required, which in turn means this dynamic
// import must live in a Client Component (Next.js disallows it in Server
// Components). The Command Center page itself stays a Server Component
// and just renders this loader with plain serializable data.
const FleetMap = dynamic(() => import("./fleet-map").then((mod) => mod.FleetMap), {
  ssr: false,
  loading: () => <Skeleton className="h-full min-h-80 w-full rounded-lg" />,
});

export function FleetMapLoader({ vehicles }: { vehicles: FleetMapVehicle[] }) {
  return <FleetMap vehicles={vehicles} />;
}
