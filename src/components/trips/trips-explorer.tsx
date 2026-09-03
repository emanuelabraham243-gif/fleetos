"use client";

import { ChevronRight, Route, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { TripListItem, TripSummary } from "@/lib/data/trips";
import { formatDateTime } from "@/lib/format-time";
import { TRIP_STATUS_LABEL } from "@/lib/i18n/labels";
import type { TripStatus } from "@/lib/domain/trip";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: TripStatus[] = [
  "DRAFT",
  "ASSIGNED",
  "LOADING",
  "DISPATCHED",
  "IN_TRANSIT",
  "ARRIVED",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
];

const STATUS_BADGE_VARIANT: Record<
  TripStatus,
  "status-live" | "outline" | "status-delayed" | "status-offline" | "secondary"
> = {
  DRAFT: "secondary",
  ASSIGNED: "outline",
  LOADING: "outline",
  DISPATCHED: "status-delayed",
  IN_TRANSIT: "status-live",
  ARRIVED: "status-delayed",
  DELIVERED: "outline",
  COMPLETED: "secondary",
  CANCELLED: "status-offline",
};

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

export function TripsExplorer({
  trips,
  summary,
}: {
  trips: TripListItem[];
  summary: TripSummary;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState("");
  const [driverFilter, setDriverFilter] = useState("");

  const vehicleOptions = useMemo(
    () =>
      Array.from(
        new Map(
          trips
            .filter((t) => t.vehicle)
            .map((t) => [t.vehicle!.id, t.vehicle!.unit_number] as const),
        ),
      ).sort((a, b) => a[1].localeCompare(b[1])),
    [trips],
  );
  const driverOptions = useMemo(
    () =>
      Array.from(
        new Map(
          trips
            .filter((t) => t.driver)
            .map((t) => [t.driver!.id, t.driver!.full_name] as const),
        ),
      ).sort((a, b) => a[1].localeCompare(b[1])),
    [trips],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return trips.filter((trip) => {
      if (statusFilter && trip.status !== statusFilter) return false;
      if (vehicleFilter && trip.vehicle?.id !== vehicleFilter) return false;
      if (driverFilter && trip.driver?.id !== driverFilter) return false;
      if (query) {
        const haystack = [
          trip.trip_number,
          trip.reference_number,
          trip.origin,
          trip.destination,
          trip.vehicle?.unit_number,
          trip.driver?.full_name,
          trip.client?.name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [trips, search, statusFilter, vehicleFilter, driverFilter]);

  function toggleStatusFilter(status: TripStatus | null) {
    setStatusFilter((current) => (status === null ? "" : current === status ? "" : status));
  }

  const summaryCards: { label: string; value: number; status: TripStatus | null }[] = [
    { label: "Total Trips", value: summary.total, status: null },
    { label: "Active", value: summary.active, status: null },
    { label: "Draft", value: summary.draft, status: "DRAFT" },
    { label: "Delivered Today", value: summary.deliveredToday, status: null },
    { label: "Cancelled", value: summary.cancelled, status: "CANCELLED" },
  ];

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {summaryCards.map((card) => (
          <button
            key={card.label}
            type="button"
            onClick={() => toggleStatusFilter(card.status)}
            className={cn(
              "text-left transition-colors",
              card.status !== null && statusFilter === card.status && "ring-primary ring-2",
            )}
          >
            <Card className="hover:bg-accent/50 cursor-pointer">
              <CardContent className="flex flex-col gap-1">
                <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  {card.label}
                </span>
                <span className="text-2xl font-semibold tabular-nums">{card.value}</span>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <div className="relative max-w-sm">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search trip #, reference, origin, destination, vehicle, driver, client…"
            className="pl-8"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterSelect
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={STATUS_OPTIONS.map((s) => ({ value: s, label: TRIP_STATUS_LABEL[s] }))}
          />
          <FilterSelect
            label="Vehicle"
            value={vehicleFilter}
            onChange={setVehicleFilter}
            options={vehicleOptions.map(([id, unitNumber]) => ({ value: id, label: `Unit ${unitNumber}` }))}
          />
          <FilterSelect
            label="Driver"
            value={driverFilter}
            onChange={setDriverFilter}
            options={driverOptions.map(([id, name]) => ({ value: id, label: name }))}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Route className="text-muted-foreground size-8" />
            <p className="text-muted-foreground max-w-sm text-sm">
              {trips.length === 0
                ? "No trips yet. Create the first trip to start dispatching."
                : "No trips match these filters."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop: table */}
          <Card className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trip #</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead className="w-8" aria-label="Actions" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((trip) => (
                  <TableRow
                    key={trip.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/trips/${trip.id}`)}
                  >
                    <TableCell className="font-medium">{trip.trip_number}</TableCell>
                    <TableCell>
                      {trip.origin ?? "?"} → {trip.destination ?? "?"}
                    </TableCell>
                    <TableCell>{trip.vehicle ? `Unit ${trip.vehicle.unit_number}` : "—"}</TableCell>
                    <TableCell>{trip.driver?.full_name ?? "Unassigned"}</TableCell>
                    <TableCell>{trip.client?.name ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_BADGE_VARIANT[trip.status]}>
                        {TRIP_STATUS_LABEL[trip.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {trip.scheduled_start ? formatDateTime(trip.scheduled_start) : "—"}
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="text-muted-foreground size-4" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Mobile: cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:hidden">
            {filtered.map((trip) => (
              <Card
                key={trip.id}
                className="hover:bg-accent/50 cursor-pointer"
                onClick={() => router.push(`/trips/${trip.id}`)}
              >
                <CardContent className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{trip.trip_number}</p>
                      <p className="text-muted-foreground text-xs">
                        {trip.origin ?? "?"} → {trip.destination ?? "?"}
                      </p>
                    </div>
                    <Badge variant={STATUS_BADGE_VARIANT[trip.status]}>
                      {TRIP_STATUS_LABEL[trip.status]}
                    </Badge>
                  </div>
                  <div className="text-muted-foreground grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                    <span>Vehicle</span>
                    <span className="text-foreground text-right">
                      {trip.vehicle ? `Unit ${trip.vehicle.unit_number}` : "—"}
                    </span>
                    <span>Driver</span>
                    <span className="text-foreground text-right">{trip.driver?.full_name ?? "Unassigned"}</span>
                    <span>Scheduled</span>
                    <span className="text-foreground text-right">
                      {trip.scheduled_start ? formatDateTime(trip.scheduled_start) : "—"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
