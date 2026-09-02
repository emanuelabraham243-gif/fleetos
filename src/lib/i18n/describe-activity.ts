import { TRIP_STATUS_LABEL } from "@/lib/i18n/labels";
import type { ActivityEvent } from "@/lib/data/activity";
import type { TripStatus } from "@/lib/domain/trip";

/**
 * Turns a language-neutral activity event + its facts into the English
 * sentence shown in the timeline. This is the only place that does that
 * translation -- swap it for a locale-aware version later without
 * touching the query layer or the event tokens themselves.
 */
export function describeActivityEvent(
  event: ActivityEvent,
  context: { unitNumber: string | null },
): string {
  const unit = context.unitNumber ? `unit ${context.unitNumber}` : "a vehicle";

  switch (event.eventType) {
    case "TRIP_STATUS_CHANGED": {
      const tripNumber = event.details.trip_number as string | undefined;
      const status = event.details.status as TripStatus | undefined;
      const statusLabel = status ? TRIP_STATUS_LABEL[status] : "updated";
      return `Trip ${tripNumber ?? ""} ${statusLabel.toLowerCase()} (${unit})`;
    }
    case "FUEL_RECORDED": {
      const volume = event.details.volume_liters as number | undefined;
      return `Fuel transaction recorded for ${unit}${volume ? `: ${volume} L` : ""}`;
    }
    case "GPS_UPDATED":
      return `GPS position updated for ${unit}`;
    case "MAINTENANCE_COMPLETED": {
      const title = event.details.title as string | undefined;
      return `Maintenance work order completed for ${unit}${title ? `: ${title}` : ""}`;
    }
    default:
      return `Activity recorded for ${unit}`;
  }
}
