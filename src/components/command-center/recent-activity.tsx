import { Card, CardContent } from "@/components/ui/card";
import type { ActivityEvent } from "@/lib/data/activity";
import { formatClockTime } from "@/lib/format-time";
import { describeActivityEvent } from "@/lib/i18n/describe-activity";

export function RecentActivity({
  events,
  unitNumberByVehicleId,
}: {
  events: ActivityEvent[];
  unitNumberByVehicleId: Map<string, string>;
}) {
  if (events.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="text-muted-foreground py-10 text-center text-sm">
          No activity recorded yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        {events.map((event, index) => {
          const unitNumber = event.vehicleId ? (unitNumberByVehicleId.get(event.vehicleId) ?? null) : null;
          return (
            <div key={`${event.eventType}-${event.recordId}-${index}`} className="flex gap-3">
              <span className="text-muted-foreground w-12 shrink-0 pt-0.5 text-xs tabular-nums">
                {formatClockTime(event.occurredAt)}
              </span>
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
              <p className="text-sm">{describeActivityEvent(event, { unitNumber })}</p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
