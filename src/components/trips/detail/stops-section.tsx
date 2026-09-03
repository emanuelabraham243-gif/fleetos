import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { TripStop } from "@/lib/data/trip-stops";
import { formatDateTime } from "@/lib/format-time";
import { TRIP_STOP_STATUS_LABEL, TRIP_STOP_TYPE_LABEL } from "@/lib/i18n/labels";
import type { TripStopStatus } from "@/lib/domain/trip-stop";

const STOP_STATUS_BADGE_VARIANT: Record<
  TripStopStatus,
  "status-live" | "outline" | "status-delayed" | "secondary"
> = {
  PLANNED: "outline",
  ARRIVED: "status-delayed",
  IN_PROGRESS: "status-live",
  COMPLETED: "secondary",
  SKIPPED: "secondary",
};

export function StopsSection({ stops }: { stops: TripStop[] }) {
  if (stops.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="text-muted-foreground py-10 text-center text-sm">
          No stops recorded for this trip -- it runs directly from origin to destination.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        {stops.map((stop) => (
          <div key={stop.id} className="flex items-start justify-between gap-4 border-b pb-4 text-sm last:border-b-0 last:pb-0">
            <div>
              <p className="font-medium">
                {stop.sequence}. {stop.location}
              </p>
              <p className="text-muted-foreground text-xs">{TRIP_STOP_TYPE_LABEL[stop.stop_type]}</p>
              {stop.notes ? <p className="text-muted-foreground mt-1 text-xs">{stop.notes}</p> : null}
              <div className="text-muted-foreground mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs">
                {stop.scheduled_at ? <span>Scheduled {formatDateTime(stop.scheduled_at)}</span> : null}
                {stop.arrived_at ? <span>Arrived {formatDateTime(stop.arrived_at)}</span> : null}
                {stop.departed_at ? <span>Departed {formatDateTime(stop.departed_at)}</span> : null}
              </div>
            </div>
            <Badge variant={STOP_STATUS_BADGE_VARIANT[stop.status]}>
              {TRIP_STOP_STATUS_LABEL[stop.status]}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
