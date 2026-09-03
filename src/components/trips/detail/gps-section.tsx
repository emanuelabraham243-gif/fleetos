import { Info } from "lucide-react";

import { GpsStatusWithFreshness } from "@/components/gps-status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import type { GpsEvent } from "@/lib/data/gps-events";
import { formatClockTime } from "@/lib/format-time";
import { detectPossibleArrival } from "@/lib/gps/arrival-proximity";

export function GpsSection({
  destination,
  isActiveEnRoute,
  latestLocation,
  recentEvents,
}: {
  destination: string | null;
  /** Whether the trip is currently in a status where "en route" reasoning makes sense (DISPATCHED/IN_TRANSIT). */
  isActiveEnRoute: boolean;
  latestLocation: { latitude: number; longitude: number; recorded_at: string } | null;
  recentEvents: GpsEvent[];
}) {
  const arrival = isActiveEnRoute
    ? detectPossibleArrival({
        destination,
        vehicleLocation: latestLocation
          ? { lat: latestLocation.latitude, lng: latestLocation.longitude, recordedAt: latestLocation.recorded_at }
          : null,
      })
    : { isPossibleArrival: false, distanceKm: null };

  return (
    <div className="flex flex-col gap-4">
      {arrival.isPossibleArrival ? (
        <Alert>
          <Info />
          <AlertTitle>Possible arrival detected</AlertTitle>
          <AlertDescription>
            The vehicle&apos;s last known position is about {arrival.distanceKm?.toFixed(1)} km from{" "}
            {destination}. This is an advisory based on GPS proximity only -- it does not change the
            trip&apos;s status. Confirm arrival manually once verified.
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Current Position</h3>
            <GpsStatusWithFreshness recordedAt={latestLocation?.recorded_at ?? null} />
          </div>
          <p className="text-muted-foreground text-xs">
            {latestLocation
              ? `${latestLocation.latitude.toFixed(4)}, ${latestLocation.longitude.toFixed(4)}`
              : "No GPS data received yet."}
          </p>
        </CardContent>
      </Card>

      {recentEvents.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="text-muted-foreground py-10 text-center text-sm">
            GPS data unavailable.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col gap-2">
            {recentEvents.map((event) => (
              <div key={event.id} className="flex items-center gap-3 text-sm">
                <span className="text-muted-foreground w-16 shrink-0 tabular-nums">
                  {formatClockTime(event.recorded_at)}
                </span>
                <span>
                  {event.latitude.toFixed(4)}, {event.longitude.toFixed(4)}
                </span>
                {event.speed_kph !== null ? (
                  <span className="text-muted-foreground text-xs">{event.speed_kph} km/h</span>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
