import { Card, CardContent } from "@/components/ui/card";
import type { VehicleHistoryEvent } from "@/lib/data/vehicle-history";

export function HistoryTab({ events }: { events: VehicleHistoryEvent[] }) {
  if (events.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="text-muted-foreground py-10 text-center text-sm">
          No history recorded for this vehicle yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        {events.map((event) => (
          <div key={event.id} className="flex gap-3 text-sm">
            <span className="text-muted-foreground w-32 shrink-0 text-xs tabular-nums">
              {new Date(event.timestamp).toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
            <div>
              <p>{event.description}</p>
              {event.actorName ? (
                <p className="text-muted-foreground text-xs">by {event.actorName}</p>
              ) : null}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
