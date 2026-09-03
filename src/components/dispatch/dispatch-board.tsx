"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TripStatusActions } from "@/components/trips/trip-status-actions";
import type { TripListItem } from "@/lib/data/trips";
import { formatDateTime } from "@/lib/format-time";
import { TRIP_STATUS_LABEL } from "@/lib/i18n/labels";
import type { TripStatus } from "@/lib/domain/trip";

const BOARD_COLUMNS: TripStatus[] = [
  "DRAFT",
  "ASSIGNED",
  "LOADING",
  "DISPATCHED",
  "IN_TRANSIT",
  "ARRIVED",
  "DELIVERED",
];

export function DispatchBoard({ trips, canManage }: { trips: TripListItem[]; canManage: boolean }) {
  const byStatus = new Map<TripStatus, TripListItem[]>(BOARD_COLUMNS.map((s) => [s, []]));
  for (const trip of trips) {
    byStatus.get(trip.status)?.push(trip);
  }

  return (
    <div className="grid grid-flow-col auto-cols-[minmax(260px,1fr)] gap-4 overflow-x-auto pb-2">
      {BOARD_COLUMNS.map((status) => {
        const columnTrips = byStatus.get(status) ?? [];
        return (
          <div key={status} className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold">{TRIP_STATUS_LABEL[status]}</h2>
              <Badge variant="secondary">{columnTrips.length}</Badge>
            </div>
            <div className="flex flex-col gap-2">
              {columnTrips.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="text-muted-foreground py-6 text-center text-xs">
                    No trips
                  </CardContent>
                </Card>
              ) : (
                columnTrips.map((trip) => (
                  <Card key={trip.id}>
                    <CardHeader className="pb-2">
                      <Link href={`/trips/${trip.id}`} className="font-medium hover:underline">
                        {trip.trip_number}
                      </Link>
                      <p className="text-muted-foreground text-xs">
                        {trip.origin ?? "?"} → {trip.destination ?? "?"}
                      </p>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2 pt-0 text-xs">
                      <div className="text-muted-foreground flex flex-col gap-0.5">
                        <span>{trip.vehicle ? `Unit ${trip.vehicle.unit_number}` : "No vehicle"}</span>
                        <span>{trip.driver?.full_name ?? "Unassigned"}</span>
                        {trip.scheduled_start ? <span>{formatDateTime(trip.scheduled_start)}</span> : null}
                      </div>
                      {canManage ? (
                        <TripStatusActions tripId={trip.id} status={trip.status} size="sm" />
                      ) : null}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
