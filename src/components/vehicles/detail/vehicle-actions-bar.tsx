import { Fuel, Pencil, Route, ShieldAlert, Wrench } from "lucide-react";
import Link from "next/link";

import { AssignDriverDialog } from "@/components/vehicles/detail/assign-driver-dialog";
import { Button } from "@/components/ui/button";
import type { VehicleOperationalStatus } from "@/lib/domain/vehicle";

export function VehicleActionsBar({
  vehicleId,
  canManage,
  operationalStatus,
  drivers,
  currentDriverId,
}: {
  vehicleId: string;
  canManage: boolean;
  operationalStatus: VehicleOperationalStatus;
  drivers: { id: string; full_name: string }[];
  currentDriverId: string | null;
}) {
  const canStartTrip = operationalStatus === "AVAILABLE" || operationalStatus === "OFFLINE";

  return (
    <div className="flex flex-wrap gap-2">
      {canManage ? (
        <Button variant="outline" size="sm" asChild>
          <Link href={`/vehicles/${vehicleId}/edit`}>
            <Pencil />
            Edit Vehicle
          </Link>
        </Button>
      ) : null}

      {canManage ? (
        <AssignDriverDialog vehicleId={vehicleId} drivers={drivers} currentDriverId={currentDriverId} />
      ) : null}

      {canStartTrip ? (
        <Button variant="outline" size="sm" asChild>
          <Link href={`/trips/new?vehicleId=${vehicleId}`}>
            <Route />
            Start Trip
          </Link>
        </Button>
      ) : null}

      <Button variant="outline" size="sm" asChild>
        <Link href={`/finance/fuel/new?vehicleId=${vehicleId}`}>
          <Fuel />
          Record Fuel
        </Link>
      </Button>

      <Button variant="outline" size="sm" asChild>
        <Link href={`/issues/incidents/new?vehicleId=${vehicleId}`}>
          <ShieldAlert />
          Report Issue
        </Link>
      </Button>

      <Button variant="outline" size="sm" asChild>
        <Link href={`/maintenance/new?vehicleId=${vehicleId}`}>
          <Wrench />
          Schedule Maintenance
        </Link>
      </Button>
    </div>
  );
}
