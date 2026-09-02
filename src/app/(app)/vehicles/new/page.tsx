import { PagePlaceholder } from "@/components/page-placeholder";
import { VehicleForm } from "@/components/vehicles/vehicle-form";
import { getCurrentProfile } from "@/lib/data/profile";
import { canManageFleet } from "@/lib/domain/permissions";
import { Truck } from "lucide-react";

import { createVehicle } from "../actions";

export default async function NewVehiclePage() {
  const profile = await getCurrentProfile();

  if (!profile || !canManageFleet(profile.role)) {
    return (
      <PagePlaceholder
        icon={Truck}
        title="Add Vehicle"
        description="Your role doesn't have permission to add vehicles to the fleet."
      />
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Add Vehicle</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Add a new vehicle to the fleet.
        </p>
      </div>
      <VehicleForm action={createVehicle} submitLabel="Add Vehicle" />
    </div>
  );
}
