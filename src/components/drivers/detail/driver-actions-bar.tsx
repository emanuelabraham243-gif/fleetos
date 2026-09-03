import { Pencil, Route, ShieldAlert } from "lucide-react";
import Link from "next/link";

import { AssignVehicleDialog } from "@/components/drivers/detail/assign-vehicle-dialog";
import { EndAssignmentButton } from "@/components/drivers/detail/end-assignment-button";
import { UploadDocumentDialog } from "@/components/drivers/detail/upload-document-dialog";
import { Button } from "@/components/ui/button";

export function DriverActionsBar({
  driverId,
  canManage,
  vehicles,
  currentVehicleId,
  activeTripId,
}: {
  driverId: string;
  canManage: boolean;
  vehicles: { id: string; unit_number: string }[];
  currentVehicleId: string | null;
  activeTripId: string | null;
}) {
  if (!canManage) {
    return activeTripId ? (
      <Button variant="outline" size="sm" asChild>
        <Link href={`/trips/${activeTripId}`}>
          <Route />
          View Current Trip
        </Link>
      </Button>
    ) : null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" asChild>
        <Link href={`/drivers/${driverId}/edit`}>
          <Pencil />
          Edit Driver
        </Link>
      </Button>

      <AssignVehicleDialog driverId={driverId} vehicles={vehicles} currentVehicleId={currentVehicleId} />

      {currentVehicleId ? <EndAssignmentButton driverId={driverId} /> : null}

      {activeTripId ? (
        <Button variant="outline" size="sm" asChild>
          <Link href={`/trips/${activeTripId}`}>
            <Route />
            View Current Trip
          </Link>
        </Button>
      ) : null}

      <Button variant="outline" size="sm" asChild>
        <Link href={`/issues/incidents/new?driverId=${driverId}`}>
          <ShieldAlert />
          Report Issue
        </Link>
      </Button>

      <UploadDocumentDialog driverId={driverId} />
    </div>
  );
}
