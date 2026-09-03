"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { VehicleTrip } from "@/lib/data/vehicles";
import { formatCurrency } from "@/lib/format-currency";
import { formatDateTime as formatDateTimeAddis } from "@/lib/format-time";
import { TRIP_STATUS_LABEL } from "@/lib/i18n/labels";

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  return formatDateTimeAddis(value);
}

export function TripsTab({
  trips,
  revenueByTrip,
}: {
  trips: VehicleTrip[];
  revenueByTrip: Map<string, { amount: number; currency: string }>;
}) {
  const [statusFilter, setStatusFilter] = useState("");
  const [driverFilter, setDriverFilter] = useState("");

  const driverOptions = useMemo(
    () => Array.from(new Set(trips.map((t) => t.driver?.full_name).filter((v): v is string => !!v))),
    [trips],
  );

  const filtered = trips.filter((trip) => {
    if (statusFilter && trip.status !== statusFilter) return false;
    if (driverFilter && trip.driver?.full_name !== driverFilter) return false;
    return true;
  });

  if (trips.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="text-muted-foreground py-10 text-center text-sm">
          No trips recorded for this vehicle.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <select
          aria-label="Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border-input bg-background h-9 rounded-md border px-2 text-sm shadow-xs"
        >
          <option value="">Status</option>
          {Object.entries(TRIP_STATUS_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          aria-label="Driver"
          value={driverFilter}
          onChange={(e) => setDriverFilter(e.target.value)}
          className="border-input bg-background h-9 rounded-md border px-2 text-sm shadow-xs"
        >
          <option value="">Driver</option>
          {driverOptions.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="text-muted-foreground py-8 text-center text-sm">
            No trips match these filters.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trip #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Origin</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Departure</TableHead>
                <TableHead>Arrival</TableHead>
                <TableHead>Distance</TableHead>
                <TableHead>Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((trip) => {
                const revenue = revenueByTrip.get(trip.id);
                return (
                  <TableRow key={trip.id}>
                    <TableCell className="font-medium">{trip.trip_number}</TableCell>
                    <TableCell className="text-xs">
                      {formatDateTime(trip.scheduled_start ?? trip.created_at)}
                    </TableCell>
                    <TableCell>{trip.origin ?? "?"}</TableCell>
                    <TableCell>{trip.destination ?? "?"}</TableCell>
                    <TableCell>{trip.driver?.full_name ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{TRIP_STATUS_LABEL[trip.status]}</Badge>
                    </TableCell>
                    <TableCell className="text-xs">{formatDateTime(trip.actual_start)}</TableCell>
                    <TableCell className="text-xs">{formatDateTime(trip.actual_end)}</TableCell>
                    <TableCell>{trip.distance_km != null ? `${trip.distance_km} km` : "—"}</TableCell>
                    <TableCell>
                      {revenue ? (
                        formatCurrency(revenue.amount, revenue.currency)
                      ) : (
                        <span className="text-muted-foreground italic">No data</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
