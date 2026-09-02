import { Truck } from "lucide-react";

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
import { getVehicles } from "@/lib/data/vehicles";
import { createClient } from "@/lib/supabase/server";

export default async function VehiclesPage() {
  const supabase = await createClient();
  const vehicles = await getVehicles(supabase);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Vehicles</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {vehicles.length} vehicle{vehicles.length === 1 ? "" : "s"} in the fleet.
        </p>
      </div>

      {vehicles.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Truck className="text-muted-foreground size-8" />
            <p className="text-muted-foreground max-w-sm text-sm">
              No vehicles yet. Add the first vehicle to the fleet to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Unit</TableHead>
                <TableHead>Make / Model</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Odometer</TableHead>
                <TableHead>GPS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles.map((vehicle) => (
                <TableRow key={vehicle.id}>
                  <TableCell className="font-medium">{vehicle.unit_number}</TableCell>
                  <TableCell>
                    {[vehicle.year, vehicle.make, vehicle.model]
                      .filter(Boolean)
                      .join(" ") || "—"}
                  </TableCell>
                  <TableCell className="capitalize">{vehicle.vehicle_type}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {vehicle.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>{Number(vehicle.odometer_km).toLocaleString()} km</TableCell>
                  <TableCell>
                    <GpsStatusBadge recordedAt={vehicle.vehicle_locations?.recorded_at} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
