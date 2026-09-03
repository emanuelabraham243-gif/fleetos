"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

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
import type { TripListItem } from "@/lib/data/trips";
import type { TripStatus } from "@/lib/domain/trip";
import { formatDate, formatDateTime } from "@/lib/format-time";
import { TRIP_STATUS_LABEL } from "@/lib/i18n/labels";

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="border-input bg-background h-9 rounded-md border px-2 text-sm shadow-xs"
    >
      <option value="">{label}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function DriverTripsTab({
  trips,
  deliveryCountByTripId,
}: {
  trips: TripListItem[];
  deliveryCountByTripId: Map<string, number>;
}) {
  const [statusFilter, setStatusFilter] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState("");

  const vehicleOptions = useMemo(
    () =>
      Array.from(
        new Map(
          trips.filter((t) => t.vehicle).map((t) => [t.vehicle!.id, t.vehicle!.unit_number] as const),
        ),
      ).sort((a, b) => a[1].localeCompare(b[1])),
    [trips],
  );
  const statusOptions = useMemo(
    () => Array.from(new Set(trips.map((t) => t.status))).sort(),
    [trips],
  );

  const filtered = trips.filter((trip) => {
    if (statusFilter && trip.status !== statusFilter) return false;
    if (vehicleFilter && trip.vehicle?.id !== vehicleFilter) return false;
    return true;
  });

  if (trips.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="text-muted-foreground py-10 text-center text-sm">
          No trips recorded for this driver yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <FilterSelect
          label="Status"
          value={statusFilter}
          onChange={setStatusFilter}
          options={statusOptions.map((s) => ({ value: s, label: TRIP_STATUS_LABEL[s as TripStatus] }))}
        />
        <FilterSelect
          label="Vehicle"
          value={vehicleFilter}
          onChange={setVehicleFilter}
          options={vehicleOptions.map(([id, unitNumber]) => ({ value: id, label: `Unit ${unitNumber}` }))}
        />
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Trip #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Origin</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Departure</TableHead>
              <TableHead>Arrival</TableHead>
              <TableHead>Deliveries</TableHead>
              <TableHead>Distance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((trip) => (
              <TableRow key={trip.id}>
                <TableCell className="font-medium">
                  <Link href={`/trips/${trip.id}`} className="hover:underline">
                    {trip.trip_number}
                  </Link>
                </TableCell>
                <TableCell className="text-xs">
                  {trip.scheduled_start ? formatDate(trip.scheduled_start) : "—"}
                </TableCell>
                <TableCell>{trip.vehicle ? `Unit ${trip.vehicle.unit_number}` : "—"}</TableCell>
                <TableCell>{trip.origin ?? "—"}</TableCell>
                <TableCell>{trip.destination ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant="outline">{TRIP_STATUS_LABEL[trip.status]}</Badge>
                </TableCell>
                <TableCell className="text-xs">
                  {trip.actual_start ? formatDateTime(trip.actual_start) : "—"}
                </TableCell>
                <TableCell className="text-xs">
                  {trip.actual_end ? formatDateTime(trip.actual_end) : "—"}
                </TableCell>
                <TableCell>{deliveryCountByTripId.get(trip.id) ?? 0}</TableCell>
                <TableCell>{trip.distance_km !== null ? `${trip.distance_km} km` : "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
