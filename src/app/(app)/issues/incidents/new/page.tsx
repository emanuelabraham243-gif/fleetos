import { ShieldAlert } from "lucide-react";

import { PagePlaceholder } from "@/components/page-placeholder";
import { IncidentForm } from "@/components/incidents/incident-form";
import { getCurrentProfile } from "@/lib/data/profile";
import { getDrivers } from "@/lib/data/drivers";
import { getTrips } from "@/lib/data/trips";
import { getVehicles } from "@/lib/data/vehicles";
import { canManageFleet } from "@/lib/domain/permissions";
import { createClient } from "@/lib/supabase/server";

export default async function ReportIncidentPage() {
  const profile = await getCurrentProfile();
  if (!profile || !canManageFleet(profile.role)) {
    return (
      <PagePlaceholder
        icon={ShieldAlert}
        title="Report Incident"
        description="Your role doesn't have permission to report incidents."
      />
    );
  }

  const supabase = await createClient();
  const [vehicles, drivers, trips] = await Promise.all([
    getVehicles(supabase),
    getDrivers(supabase),
    getTrips(supabase),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Report Incident</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Record what happened -- an observation, not a diagnosis or fault determination.
        </p>
      </div>
      <IncidentForm
        vehicles={vehicles.map((v) => ({ id: v.id, unitNumber: v.unit_number }))}
        drivers={drivers.map((d) => ({ id: d.id, fullName: d.full_name }))}
        trips={trips.map((t) => ({ id: t.id, tripNumber: t.trip_number, vehicleId: t.vehicle_id }))}
      />
    </div>
  );
}
