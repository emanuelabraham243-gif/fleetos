"use client";

import { ChevronRight, Search, Users } from "lucide-react";
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
import type { DriverBoardEntry, DriverSummary } from "@/lib/data/driver-board";
import { computeDocumentStatus, type DocumentStatus } from "@/lib/domain/document";
import type { DriverOperationalState, DriverStatus } from "@/lib/domain/driver";
import { formatDate, formatDateTime } from "@/lib/format-time";
import {
  DOCUMENT_STATUS_LABEL,
  DRIVER_OPERATIONAL_STATE_LABEL,
  DRIVER_STATUS_LABEL,
} from "@/lib/i18n/labels";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: DriverStatus[] = ["ACTIVE", "INACTIVE", "ON_LEAVE", "SUSPENDED", "TERMINATED"];
const LICENSE_STATUS_OPTIONS: DocumentStatus[] = ["VALID", "EXPIRING_SOON", "EXPIRED", "UNKNOWN"];

const STATUS_BADGE_VARIANT: Record<DriverStatus, "outline" | "status-delayed" | "status-offline" | "secondary"> = {
  ACTIVE: "outline",
  INACTIVE: "secondary",
  ON_LEAVE: "status-delayed",
  SUSPENDED: "status-offline",
  TERMINATED: "status-offline",
};

const STATE_BADGE_VARIANT: Record<
  DriverOperationalState,
  "status-live" | "outline" | "status-delayed" | "status-offline" | "secondary"
> = {
  AVAILABLE: "outline",
  ON_TRIP: "status-live",
  LOADING: "status-delayed",
  ARRIVED: "status-delayed",
  OFF_DUTY: "secondary",
  ON_LEAVE: "status-delayed",
  INACTIVE: "secondary",
  UNKNOWN: "secondary",
};

const LICENSE_BADGE_VARIANT: Record<DocumentStatus, "status-live" | "status-delayed" | "status-offline" | "status-unknown"> = {
  VALID: "status-live",
  EXPIRING_SOON: "status-delayed",
  EXPIRED: "status-offline",
  UNKNOWN: "status-unknown",
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

export function DriversExplorer({
  drivers,
  summary,
}: {
  drivers: DriverBoardEntry[];
  summary: DriverSummary;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState("");
  const [licenseFilter, setLicenseFilter] = useState("");

  const vehicleOptions = useMemo(
    () =>
      Array.from(
        new Map(
          drivers
            .filter((d) => d.currentVehicle)
            .map((d) => [d.currentVehicle!.id, d.currentVehicle!.unit_number] as const),
        ),
      ).sort((a, b) => a[1].localeCompare(b[1])),
    [drivers],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return drivers.filter((driver) => {
      if (statusFilter && driver.status !== statusFilter) return false;
      if (vehicleFilter && driver.currentVehicle?.id !== vehicleFilter) return false;
      if (licenseFilter && computeDocumentStatus(driver.license_expiry) !== licenseFilter) return false;
      if (query) {
        const haystack = [
          driver.full_name,
          driver.phone,
          driver.employee_id,
          driver.license_number,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [drivers, search, statusFilter, vehicleFilter, licenseFilter]);

  function toggleStatusFilter(status: DriverStatus | null) {
    setStatusFilter((current) => (status === null ? "" : current === status ? "" : status));
  }

  const summaryCards: { label: string; value: number; status: DriverStatus | null }[] = [
    { label: "Total Drivers", value: summary.total, status: null },
    { label: "Active", value: summary.active, status: "ACTIVE" },
    { label: "Assigned", value: summary.assigned, status: null },
    { label: "Available", value: summary.available, status: null },
    { label: "On Trip", value: summary.onTrip, status: null },
    { label: "Inactive", value: summary.inactive, status: "INACTIVE" },
    { label: "Documents Expiring", value: summary.documentsExpiring, status: null },
  ];

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-7">
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
            placeholder="Search name, phone, employee ID, license number…"
            className="pl-8"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterSelect
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={STATUS_OPTIONS.map((s) => ({ value: s, label: DRIVER_STATUS_LABEL[s] }))}
          />
          <FilterSelect
            label="Vehicle"
            value={vehicleFilter}
            onChange={setVehicleFilter}
            options={vehicleOptions.map(([id, unitNumber]) => ({ value: id, label: `Unit ${unitNumber}` }))}
          />
          <FilterSelect
            label="License status"
            value={licenseFilter}
            onChange={setLicenseFilter}
            options={LICENSE_STATUS_OPTIONS.map((s) => ({ value: s, label: DOCUMENT_STATUS_LABEL[s] }))}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Users className="text-muted-foreground size-8" />
            <p className="text-muted-foreground max-w-sm text-sm">
              {drivers.length === 0
                ? "No drivers yet. Add the first driver to the roster to get started."
                : "No drivers match these filters."}
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
                  <TableHead>Driver</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>License</TableHead>
                  <TableHead>License Expiry</TableHead>
                  <TableHead>Current Vehicle</TableHead>
                  <TableHead>Current Trip</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Trip State</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead className="w-8" aria-label="Actions" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((driver) => {
                  const licenseStatus = computeDocumentStatus(driver.license_expiry);
                  return (
                    <TableRow
                      key={driver.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/drivers/${driver.id}`)}
                    >
                      <TableCell className="font-medium">{driver.full_name}</TableCell>
                      <TableCell>{driver.phone ?? "—"}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs">{driver.license_number ?? "—"}</span>
                          <Badge variant={LICENSE_BADGE_VARIANT[licenseStatus]} className="w-fit">
                            {DOCUMENT_STATUS_LABEL[licenseStatus]}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        {driver.license_expiry ? formatDate(driver.license_expiry) : "—"}
                      </TableCell>
                      <TableCell>
                        {driver.currentVehicle ? `Unit ${driver.currentVehicle.unit_number}` : "Unassigned"}
                      </TableCell>
                      <TableCell>
                        {driver.activeTrip
                          ? `${driver.activeTrip.origin ?? "?"} → ${driver.activeTrip.destination ?? "?"}`
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_BADGE_VARIANT[driver.status]}>
                          {DRIVER_STATUS_LABEL[driver.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATE_BADGE_VARIANT[driver.operationalState]}>
                          {DRIVER_OPERATIONAL_STATE_LABEL[driver.operationalState]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{formatDateTime(driver.updated_at)}</TableCell>
                      <TableCell>
                        <ChevronRight className="text-muted-foreground size-4" />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>

          {/* Mobile: cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:hidden">
            {filtered.map((driver) => {
              const licenseStatus = computeDocumentStatus(driver.license_expiry);
              return (
                <Card
                  key={driver.id}
                  className="hover:bg-accent/50 cursor-pointer"
                  onClick={() => router.push(`/drivers/${driver.id}`)}
                >
                  <CardContent className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{driver.full_name}</p>
                        <p className="text-muted-foreground text-xs">{driver.phone ?? "No phone on file"}</p>
                      </div>
                      <Badge variant={STATUS_BADGE_VARIANT[driver.status]}>
                        {DRIVER_STATUS_LABEL[driver.status]}
                      </Badge>
                    </div>
                    <div className="text-muted-foreground grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                      <span>Vehicle</span>
                      <span className="text-foreground text-right">
                        {driver.currentVehicle ? `Unit ${driver.currentVehicle.unit_number}` : "Unassigned"}
                      </span>
                      <span>License</span>
                      <span className="text-foreground text-right">
                        {DOCUMENT_STATUS_LABEL[licenseStatus]}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t pt-2">
                      <Badge variant={STATE_BADGE_VARIANT[driver.operationalState]}>
                        {DRIVER_OPERATIONAL_STATE_LABEL[driver.operationalState]}
                      </Badge>
                      <span className="text-muted-foreground text-[11px]">
                        {formatDateTime(driver.updated_at)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
