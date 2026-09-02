import { notFound } from "next/navigation";

import { GpsStatusWithFreshness } from "@/components/gps-status-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getVehicleById, getVehicleTrips } from "@/lib/data/vehicles";
import { TRIP_STATUS_LABEL } from "@/lib/i18n/labels";
import { createClient } from "@/lib/supabase/server";

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const vehicle = await getVehicleById(supabase, id);
  if (!vehicle) {
    notFound();
  }

  const trips = await getVehicleTrips(supabase, id);
  const location = vehicle.vehicle_locations;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Unit {vehicle.unit_number}</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {[vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ") || "Vehicle detail"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Vehicle</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <span className="text-muted-foreground">Status</span>
            <span className="capitalize">{vehicle.status.replace("_", " ")}</span>
            <span className="text-muted-foreground">Type</span>
            <span className="capitalize">{vehicle.vehicle_type}</span>
            <span className="text-muted-foreground">Plate</span>
            <span>{vehicle.license_plate ?? "—"}</span>
            <span className="text-muted-foreground">VIN</span>
            <span className="truncate">{vehicle.vin ?? "—"}</span>
            <span className="text-muted-foreground">Odometer</span>
            <span>{Number(vehicle.odometer_km).toLocaleString()} km</span>
            <span className="text-muted-foreground">Fuel type</span>
            <span className="capitalize">{vehicle.fuel_type}</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">GPS</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <GpsStatusWithFreshness recordedAt={location?.recorded_at} />
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <span className="text-muted-foreground">Location</span>
              <span>
                {location ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : "Unknown"}
              </span>
              <span className="text-muted-foreground">Speed</span>
              <span>{location?.speed_kph !== null && location?.speed_kph !== undefined ? `${location.speed_kph} km/h` : "—"}</span>
              <span className="text-muted-foreground">Ignition</span>
              <span>{location?.ignition_on === null || location?.ignition_on === undefined ? "—" : location.ignition_on ? "ON" : "OFF"}</span>
              <span className="text-muted-foreground">Movement</span>
              <span className="capitalize">{location?.movement_state ?? "—"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Notes</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            {vehicle.notes ?? "No notes on file."}
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-muted-foreground mb-2 text-sm font-semibold tracking-wide uppercase">
          Trips
        </h2>
        {trips.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="text-muted-foreground py-10 text-center text-sm">
              No trips recorded for this vehicle yet.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trip</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Scheduled</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trips.map((trip) => (
                  <TableRow key={trip.id}>
                    <TableCell className="font-medium">{trip.trip_number}</TableCell>
                    <TableCell>{trip.driver?.full_name ?? "—"}</TableCell>
                    <TableCell>
                      {trip.origin ?? "?"} → {trip.destination ?? "?"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{TRIP_STATUS_LABEL[trip.status]}</Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {trip.scheduled_start
                        ? new Date(trip.scheduled_start).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </div>
  );
}
