import { Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { VehiclesExplorer, type VehicleListRow } from "@/components/vehicles/vehicles-explorer";
import { getCurrentAssignmentsByVehicle } from "@/lib/data/driver-assignments";
import { buildFleetBoard, summarizeFleet } from "@/lib/data/fleet";
import { getUpcomingMaintenanceByVehicle } from "@/lib/data/maintenance";
import { getCurrentProfile } from "@/lib/data/profile";
import { getActiveTrips } from "@/lib/data/trips";
import { getVehicles } from "@/lib/data/vehicles";
import { deriveVehicleListStatus } from "@/lib/domain/vehicle";
import { canManageFleet } from "@/lib/domain/permissions";
import { createClient } from "@/lib/supabase/server";

export default async function VehiclesPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const [vehicles, activeTrips, currentAssignments, upcomingMaintenance] = await Promise.all([
    getVehicles(supabase),
    getActiveTrips(supabase),
    getCurrentAssignmentsByVehicle(supabase),
    getUpcomingMaintenanceByVehicle(supabase),
  ]);

  const fleetBoard = buildFleetBoard(vehicles, activeTrips);
  const summary = summarizeFleet(fleetBoard);

  const rows: VehicleListRow[] = fleetBoard.map((vehicle) => {
    const location = vehicle.vehicle_locations;
    const assignment = currentAssignments.get(vehicle.id);
    const driverName = vehicle.activeTrip?.driver?.full_name ?? assignment?.driver?.full_name ?? null;

    return {
      id: vehicle.id,
      unitNumber: vehicle.unit_number,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      licensePlate: vehicle.license_plate,
      vin: vehicle.vin,
      fuelType: vehicle.fuel_type,
      listStatus: deriveVehicleListStatus(
        vehicle.status,
        vehicle.operationalStatus,
        location?.movement_state,
      ),
      gpsStatus: vehicle.gpsStatus,
      driverName,
      tripLabel: vehicle.activeTrip
        ? `${vehicle.activeTrip.origin ?? "?"} → ${vehicle.activeTrip.destination ?? "?"}`
        : null,
      latitude: location?.latitude ?? null,
      longitude: location?.longitude ?? null,
      speedKph: location?.speed_kph ?? null,
      recordedAt: location?.recorded_at ?? null,
      odometerKm: Number(vehicle.odometer_km),
      nextMaintenance: upcomingMaintenance.get(vehicle.id) ?? null,
    };
  });

  const canAdd = profile ? canManageFleet(profile.role) : false;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Vehicles</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage and monitor your fleet.</p>
        </div>
        {canAdd ? (
          <Button asChild>
            <Link href="/vehicles/new">
              <Plus />
              Add Vehicle
            </Link>
          </Button>
        ) : null}
      </div>

      <VehiclesExplorer rows={rows} summary={summary} />
    </div>
  );
}
