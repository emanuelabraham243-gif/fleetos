"use client";

import { useRouter } from "next/navigation";

import { GpsStatusBadge } from "@/components/gps-status-badge";
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
import type { FleetBoardVehicle } from "@/lib/data/fleet";
import { formatGpsFreshness } from "@/lib/gps/status";
import { VEHICLE_OPERATIONAL_STATUS_LABEL } from "@/lib/i18n/labels";

const OPERATIONAL_STATUS_VARIANT: Record<
  FleetBoardVehicle["operationalStatus"],
  "status-live" | "outline" | "status-delayed" | "status-offline"
> = {
  ON_TRIP: "status-live",
  AVAILABLE: "outline",
  MAINTENANCE: "status-delayed",
  OFFLINE: "status-offline",
};

export function VehicleOperationsList({ vehicles }: { vehicles: FleetBoardVehicle[] }) {
  const router = useRouter();

  if (vehicles.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="text-muted-foreground py-10 text-center text-sm">
          No vehicles found.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Vehicle</TableHead>
            <TableHead>Plate</TableHead>
            <TableHead>Driver</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Current trip</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Speed</TableHead>
            <TableHead>GPS</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vehicles.map((vehicle) => {
            const location = vehicle.vehicle_locations;
            const { label: freshnessLabel } = formatGpsFreshness(location?.recorded_at);

            return (
              <TableRow
                key={vehicle.id}
                className="cursor-pointer"
                onClick={() => router.push(`/vehicles/${vehicle.id}`)}
              >
                <TableCell className="font-medium">Unit {vehicle.unit_number}</TableCell>
                <TableCell>{vehicle.license_plate ?? "—"}</TableCell>
                <TableCell>{vehicle.activeTrip?.driver?.full_name ?? "Unassigned"}</TableCell>
                <TableCell>
                  <Badge variant={OPERATIONAL_STATUS_VARIANT[vehicle.operationalStatus]}>
                    {VEHICLE_OPERATIONAL_STATUS_LABEL[vehicle.operationalStatus]}
                  </Badge>
                </TableCell>
                <TableCell>
                  {vehicle.activeTrip
                    ? `${vehicle.activeTrip.origin ?? "?"} → ${vehicle.activeTrip.destination ?? "?"}`
                    : "—"}
                </TableCell>
                <TableCell className="text-xs">
                  {location ? `${location.latitude.toFixed(3)}, ${location.longitude.toFixed(3)}` : "Unknown"}
                </TableCell>
                <TableCell>{location?.speed_kph !== null && location?.speed_kph !== undefined ? `${location.speed_kph} km/h` : "—"}</TableCell>
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <GpsStatusBadge recordedAt={location?.recorded_at} />
                    <span className="text-muted-foreground text-[11px]">{freshnessLabel}</span>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
