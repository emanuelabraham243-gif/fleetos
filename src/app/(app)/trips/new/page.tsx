import { Route } from "lucide-react";

import { PagePlaceholder } from "@/components/page-placeholder";
import { TripForm } from "@/components/trips/trip-form";
import { getClients } from "@/lib/data/clients";
import { getDrivers } from "@/lib/data/drivers";
import { getCurrentProfile } from "@/lib/data/profile";
import { getVehicles } from "@/lib/data/vehicles";
import { canManageFleet } from "@/lib/domain/permissions";
import { createClient } from "@/lib/supabase/server";

import { createTrip } from "../actions";

export default async function NewTripPage({
  searchParams,
}: {
  searchParams: Promise<{ vehicleId?: string }>;
}) {
  const profile = await getCurrentProfile();

  if (!profile || !canManageFleet(profile.role)) {
    return (
      <PagePlaceholder
        icon={Route}
        title="New Trip"
        description="Your role doesn't have permission to create trips."
      />
    );
  }

  const { vehicleId } = await searchParams;
  const supabase = await createClient();
  const [vehicles, drivers, clients] = await Promise.all([
    getVehicles(supabase),
    getDrivers(supabase),
    getClients(supabase),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New Trip</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Schedule a trip. It starts as a draft until a vehicle and driver are confirmed.
        </p>
      </div>
      <TripForm
        action={createTrip}
        submitLabel="Create Trip"
        defaultVehicleId={vehicleId}
        options={{
          vehicles: vehicles.map((v) => ({ id: v.id, unitNumber: v.unit_number })),
          drivers: drivers.map((d) => ({ id: d.id, fullName: d.full_name })),
          clients: clients.map((c) => ({ id: c.id, name: c.name })),
        }}
      />
    </div>
  );
}
