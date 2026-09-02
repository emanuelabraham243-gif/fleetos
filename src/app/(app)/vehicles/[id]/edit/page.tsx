import { Truck } from "lucide-react";
import { notFound } from "next/navigation";

import { PagePlaceholder } from "@/components/page-placeholder";
import { VehicleForm } from "@/components/vehicles/vehicle-form";
import { getCurrentProfile } from "@/lib/data/profile";
import { canManageFleet } from "@/lib/domain/permissions";
import { getVehicleById } from "@/lib/data/vehicles";
import { createClient } from "@/lib/supabase/server";

import { updateVehicle } from "../actions";

export default async function EditVehiclePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [profile, vehicle] = await Promise.all([getCurrentProfile(), getVehicleById(supabase, id)]);

  if (!vehicle) {
    notFound();
  }

  if (!profile || !canManageFleet(profile.role)) {
    return (
      <PagePlaceholder
        icon={Truck}
        title="Edit Vehicle"
        description="Your role doesn't have permission to edit vehicles."
      />
    );
  }

  const boundAction = updateVehicle.bind(null, vehicle.id);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit Unit {vehicle.unit_number}</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Changes are recorded in this vehicle&apos;s audit history.
        </p>
      </div>
      <VehicleForm
        action={boundAction}
        submitLabel="Save Changes"
        defaultValues={{
          unit_number: vehicle.unit_number,
          license_plate: vehicle.license_plate ?? "",
          make: vehicle.make ?? "",
          model: vehicle.model ?? "",
          year: vehicle.year ? String(vehicle.year) : "",
          vin: vehicle.vin ?? "",
          engine_number: vehicle.engine_number ?? "",
          fuel_type: vehicle.fuel_type,
          capacity_kg: vehicle.capacity_kg !== null ? String(vehicle.capacity_kg) : "",
          odometer_km: String(vehicle.odometer_km),
          color: vehicle.color ?? "",
          notes: vehicle.notes ?? "",
        }}
      />
    </div>
  );
}
