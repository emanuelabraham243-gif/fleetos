import { Fuel } from "lucide-react";

import { PagePlaceholder } from "@/components/page-placeholder";
import { FuelForm } from "@/components/fuel/fuel-form";
import { getVehicleOdometerProvenance } from "@/lib/data/fuel";
import { getDrivers } from "@/lib/data/drivers";
import { getCurrentProfile } from "@/lib/data/profile";
import { getDispatchTrips } from "@/lib/data/trips";
import { getVehicles } from "@/lib/data/vehicles";
import { getVendors } from "@/lib/data/vendors";
import { canManageFleet } from "@/lib/domain/permissions";
import { createClient } from "@/lib/supabase/server";

import { createFuelTransaction } from "../actions";

export default async function RecordFuelPage() {
  const profile = await getCurrentProfile();
  if (!profile || !canManageFleet(profile.role)) {
    return (
      <PagePlaceholder
        icon={Fuel}
        title="Record Fuel"
        description="Your role doesn't have permission to record fuel transactions."
      />
    );
  }

  const supabase = await createClient();
  const [vehicles, drivers, trips, vendors] = await Promise.all([
    getVehicles(supabase),
    getDrivers(supabase),
    getDispatchTrips(supabase),
    getVendors(supabase),
  ]);

  const vehiclesWithOdometer = await Promise.all(
    vehicles.map(async (v) => {
      const provenance = await getVehicleOdometerProvenance(supabase, v.id);
      return {
        id: v.id,
        unitNumber: v.unit_number,
        licensePlate: v.license_plate,
        lastKnownOdometerKm: provenance.latest?.odometerKm ?? null,
      };
    }),
  );

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Record Fuel</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Record a fuel purchase against a vehicle. The total is calculated from liters and price --
          never entered directly.
        </p>
      </div>
      <FuelForm
        action={createFuelTransaction}
        vehicles={vehiclesWithOdometer}
        drivers={drivers.map((d) => ({ id: d.id, fullName: d.full_name }))}
        trips={trips.map((t) => ({ id: t.id, tripNumber: t.trip_number, vehicleId: t.vehicle_id }))}
        vendors={vendors.map((v) => ({ id: v.id, name: v.name }))}
      />
    </div>
  );
}
