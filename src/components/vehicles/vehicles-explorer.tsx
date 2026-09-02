"use client";

import { ChevronRight, Search, Truck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { GpsStatusBadge } from "@/components/gps-status-badge";
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
import type { FleetSummary } from "@/lib/data/fleet";
import { daysUntil } from "@/lib/days-until";
import type { GpsStatus } from "@/lib/gps/status";
import { formatGpsFreshness } from "@/lib/gps/status";
import { VEHICLE_LIST_STATUS_LABEL } from "@/lib/i18n/labels";
import type { VehicleListStatus } from "@/lib/domain/vehicle";
import type { Database } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";

type MaintenanceSchedule = Database["public"]["Tables"]["maintenance_schedules"]["Row"];

export interface VehicleListRow {
  id: string;
  unitNumber: string;
  make: string | null;
  model: string | null;
  year: number | null;
  licensePlate: string | null;
  vin: string | null;
  fuelType: string;
  listStatus: VehicleListStatus;
  gpsStatus: GpsStatus;
  driverName: string | null;
  tripLabel: string | null;
  latitude: number | null;
  longitude: number | null;
  speedKph: number | null;
  recordedAt: string | null;
  odometerKm: number;
  nextMaintenance: MaintenanceSchedule | null;
}

const STATUS_OPTIONS: VehicleListStatus[] = [
  "AVAILABLE",
  "ON_TRIP",
  "IDLE",
  "MAINTENANCE",
  "OFFLINE",
  "INACTIVE",
];
const GPS_OPTIONS: GpsStatus[] = ["live", "delayed", "offline", "unknown"];

const STATUS_BADGE_VARIANT: Record<
  VehicleListStatus,
  "status-live" | "outline" | "status-delayed" | "status-offline" | "secondary"
> = {
  ON_TRIP: "status-live",
  AVAILABLE: "outline",
  IDLE: "outline",
  MAINTENANCE: "status-delayed",
  OFFLINE: "status-offline",
  INACTIVE: "secondary",
};

function formatNextMaintenance(schedule: MaintenanceSchedule | null, odometerKm: number): string {
  if (!schedule) return "—";
  if (schedule.next_due_odometer_km !== null) {
    const remaining = Math.round(schedule.next_due_odometer_km - odometerKm);
    return remaining > 0 ? `${remaining.toLocaleString()} km` : "Overdue";
  }
  if (schedule.next_due_at) {
    const days = daysUntil(schedule.next_due_at);
    if (days < 0) return `Overdue ${Math.abs(days)}d`;
    if (days === 0) return "Due today";
    return `${days} days`;
  }
  return "—";
}

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

export function VehiclesExplorer({
  rows,
  summary,
}: {
  rows: VehicleListRow[];
  summary: FleetSummary;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [fuelFilter, setFuelFilter] = useState("");
  const [makeFilter, setMakeFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [driverFilter, setDriverFilter] = useState("");
  const [gpsFilter, setGpsFilter] = useState("");

  const fuelOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.fuelType))).sort(),
    [rows],
  );
  const makeOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.make).filter((v): v is string => !!v))).sort(),
    [rows],
  );
  const yearOptions = useMemo(
    () =>
      Array.from(new Set(rows.map((r) => r.year).filter((v): v is number => v !== null))).sort(
        (a, b) => b - a,
      ),
    [rows],
  );
  const driverOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.driverName).filter((v): v is string => !!v))).sort(),
    [rows],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (statusFilter && row.listStatus !== statusFilter) return false;
      if (fuelFilter && row.fuelType !== fuelFilter) return false;
      if (makeFilter && row.make !== makeFilter) return false;
      if (yearFilter && String(row.year) !== yearFilter) return false;
      if (driverFilter && row.driverName !== driverFilter) return false;
      if (gpsFilter && row.gpsStatus !== gpsFilter) return false;
      if (query) {
        const haystack = [
          row.unitNumber,
          row.licensePlate,
          row.make,
          row.model,
          row.vin,
          row.driverName,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [rows, search, statusFilter, fuelFilter, makeFilter, yearFilter, driverFilter, gpsFilter]);

  function toggleStatusFilter(status: VehicleListStatus | null) {
    setStatusFilter((current) => (status === null ? "" : current === status ? "" : status));
  }

  const summaryCards: { label: string; value: number; status: VehicleListStatus | null }[] = [
    { label: "Total Vehicles", value: summary.total, status: null },
    { label: "On Trip", value: summary.onTrip, status: "ON_TRIP" },
    { label: "Available", value: summary.available, status: "AVAILABLE" },
    { label: "Maintenance", value: summary.maintenance, status: "MAINTENANCE" },
    { label: "Offline", value: summary.offline, status: "OFFLINE" },
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
            placeholder="Search vehicle, plate, make, model, VIN, driver…"
            className="pl-8"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterSelect
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={STATUS_OPTIONS.map((s) => ({ value: s, label: VEHICLE_LIST_STATUS_LABEL[s] }))}
          />
          <FilterSelect
            label="Fuel type"
            value={fuelFilter}
            onChange={setFuelFilter}
            options={fuelOptions.map((f) => ({ value: f, label: f }))}
          />
          <FilterSelect
            label="Make"
            value={makeFilter}
            onChange={setMakeFilter}
            options={makeOptions.map((m) => ({ value: m, label: m }))}
          />
          <FilterSelect
            label="Year"
            value={yearFilter}
            onChange={setYearFilter}
            options={yearOptions.map((y) => ({ value: String(y), label: String(y) }))}
          />
          <FilterSelect
            label="Driver"
            value={driverFilter}
            onChange={setDriverFilter}
            options={driverOptions.map((d) => ({ value: d, label: d }))}
          />
          <FilterSelect
            label="GPS status"
            value={gpsFilter}
            onChange={setGpsFilter}
            options={GPS_OPTIONS.map((g) => ({ value: g, label: g.toUpperCase() }))}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Truck className="text-muted-foreground size-8" />
            <p className="text-muted-foreground max-w-sm text-sm">
              {rows.length === 0
                ? "No vehicles yet. Add the first vehicle to the fleet to get started."
                : "No vehicles match these filters."}
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
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Plate</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Current Trip</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Speed</TableHead>
                  <TableHead>GPS</TableHead>
                  <TableHead>Mileage</TableHead>
                  <TableHead>Next Maintenance</TableHead>
                  <TableHead className="w-8" aria-label="Actions" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row) => (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/vehicles/${row.id}`)}
                  >
                    <TableCell className="font-medium">
                      Unit {row.unitNumber}
                      <div className="text-muted-foreground text-xs font-normal">
                        {[row.year, row.make, row.model].filter(Boolean).join(" ")}
                      </div>
                    </TableCell>
                    <TableCell>{row.licensePlate ?? "—"}</TableCell>
                    <TableCell>{row.driverName ?? "Unassigned"}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_BADGE_VARIANT[row.listStatus]}>
                        {VEHICLE_LIST_STATUS_LABEL[row.listStatus]}
                      </Badge>
                    </TableCell>
                    <TableCell>{row.tripLabel ?? "—"}</TableCell>
                    <TableCell className="text-xs">
                      {row.latitude !== null && row.longitude !== null
                        ? `${row.latitude.toFixed(3)}, ${row.longitude.toFixed(3)}`
                        : "Unknown"}
                    </TableCell>
                    <TableCell>{row.speedKph !== null ? `${row.speedKph} km/h` : "—"}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <GpsStatusBadge recordedAt={row.recordedAt} />
                        <span className="text-muted-foreground text-[11px]">
                          {formatGpsFreshness(row.recordedAt).label}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{Math.round(row.odometerKm).toLocaleString()} km</TableCell>
                    <TableCell>{formatNextMaintenance(row.nextMaintenance, row.odometerKm)}</TableCell>
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
            {filtered.map((row) => (
              <Card
                key={row.id}
                className="hover:bg-accent/50 cursor-pointer"
                onClick={() => router.push(`/vehicles/${row.id}`)}
              >
                <CardContent className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">Unit {row.unitNumber}</p>
                      <p className="text-muted-foreground text-xs">{row.licensePlate ?? "No plate"}</p>
                    </div>
                    <Badge variant={STATUS_BADGE_VARIANT[row.listStatus]}>
                      {VEHICLE_LIST_STATUS_LABEL[row.listStatus]}
                    </Badge>
                  </div>
                  <div className="text-muted-foreground grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                    <span>Driver</span>
                    <span className="text-foreground text-right">{row.driverName ?? "Unassigned"}</span>
                    <span>Trip</span>
                    <span className="text-foreground text-right">{row.tripLabel ?? "—"}</span>
                    <span>Mileage</span>
                    <span className="text-foreground text-right">
                      {Math.round(row.odometerKm).toLocaleString()} km
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t pt-2">
                    <GpsStatusBadge recordedAt={row.recordedAt} />
                    <span className="text-muted-foreground text-[11px]">
                      {formatGpsFreshness(row.recordedAt).label}
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
