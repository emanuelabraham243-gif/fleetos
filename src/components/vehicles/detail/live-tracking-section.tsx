import { Info } from "lucide-react";

import { GpsStatusWithFreshness } from "@/components/gps-status-badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { FleetMapLoader } from "@/components/fleet-map-loader";
import type { FleetMapVehicle } from "@/components/fleet-map";
import type { GpsEvent } from "@/lib/data/gps-events";
import type { VehicleWithLocation } from "@/lib/data/vehicles";
import { formatGpsFreshness } from "@/lib/gps/status";

export function LiveTrackingSection({
  vehicle,
  recentEvents,
  driverName,
  tripLabel,
}: {
  vehicle: VehicleWithLocation;
  recentEvents: GpsEvent[];
  driverName: string | null;
  tripLabel: string | null;
}) {
  const location = vehicle.vehicle_locations;

  const mapVehicle: FleetMapVehicle = {
    id: vehicle.id,
    unitNumber: vehicle.unit_number,
    latitude: location?.latitude ?? null,
    longitude: location?.longitude ?? null,
    gpsStatus: formatGpsFreshness(location?.recorded_at).status,
    freshnessLabel: formatGpsFreshness(location?.recorded_at).label,
    speedKph: location?.speed_kph ?? null,
    ignitionOn: location?.ignition_on ?? null,
    operationalStatus: "AVAILABLE",
    driverName,
    tripLabel,
  };

  return (
    <div className="flex flex-col gap-4">
      <Alert>
        <Info />
        <AlertDescription>
          This is simulated DEMO/MOCK GPS data from FleetOS&apos;s mock provider, not a live
          real-world feed.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="h-80 overflow-hidden p-0 lg:col-span-2">
          <CardContent className="h-full p-0">
            <FleetMapLoader vehicles={location ? [mapVehicle] : []} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-3 text-sm">
            <GpsStatusWithFreshness recordedAt={location?.recorded_at} />
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <span className="text-muted-foreground">Speed</span>
              <span>{location?.speed_kph != null ? `${location.speed_kph} km/h` : "—"}</span>
              <span className="text-muted-foreground">Heading</span>
              <span>{location?.heading_degrees != null ? `${location.heading_degrees}°` : "—"}</span>
              <span className="text-muted-foreground">Ignition</span>
              <span>{location?.ignition_on == null ? "—" : location.ignition_on ? "ON" : "OFF"}</span>
              <span className="text-muted-foreground">Movement</span>
              <span className="capitalize">{location?.movement_state ?? "—"}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h3 className="text-muted-foreground mb-2 text-sm font-semibold tracking-wide uppercase">
          Recent GPS Timeline
        </h3>
        {recentEvents.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="text-muted-foreground py-8 text-center text-sm">
              GPS data unavailable.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col gap-2">
              {recentEvents.map((event) => (
                <div key={event.id} className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground w-16 shrink-0 tabular-nums">
                    {new Date(event.recorded_at).toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span>
                    {event.speed_kph != null ? `${event.speed_kph} km/h` : "no speed data"}
                    {" · "}
                    <span className="capitalize">{event.movement_state}</span>
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
