import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import type { ActiveTrip } from "@/lib/data/trips";
import { TRIP_STATUS_LABEL } from "@/lib/i18n/labels";

export function ActiveTrips({
  trips,
  vehiclesById,
}: {
  trips: ActiveTrip[];
  vehiclesById: Map<string, FleetBoardVehicle>;
}) {
  if (trips.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="text-muted-foreground py-10 text-center text-sm">
          No active trips.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Trip</TableHead>
            <TableHead>Vehicle</TableHead>
            <TableHead>Driver</TableHead>
            <TableHead>Route</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Departed</TableHead>
            <TableHead>GPS</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trips.map((trip) => {
            const vehicle = trip.vehicle_id ? vehiclesById.get(trip.vehicle_id) : undefined;
            const { label: freshnessLabel } = formatGpsFreshness(
              vehicle?.vehicle_locations?.recorded_at,
            );

            return (
              <TableRow key={trip.id}>
                <TableCell className="font-medium">{trip.trip_number}</TableCell>
                <TableCell>{trip.vehicle ? `Unit ${trip.vehicle.unit_number}` : "—"}</TableCell>
                <TableCell>{trip.driver?.full_name ?? "—"}</TableCell>
                <TableCell>
                  {trip.origin ?? "?"} → {trip.destination ?? "?"}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{TRIP_STATUS_LABEL[trip.status]}</Badge>
                </TableCell>
                <TableCell className="text-xs">
                  {trip.actual_start
                    ? new Date(trip.actual_start).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Not departed"}
                </TableCell>
                <TableCell className="text-xs">{freshnessLabel}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
