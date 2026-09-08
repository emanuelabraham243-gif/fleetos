import { ClipboardCheck } from "lucide-react";

import { PagePlaceholder } from "@/components/page-placeholder";
import { InspectionForm } from "@/components/inspections/inspection-form";
import { getDrivers } from "@/lib/data/drivers";
import { getCurrentProfile } from "@/lib/data/profile";
import { getVehicles } from "@/lib/data/vehicles";
import { canManageFleet } from "@/lib/domain/permissions";
import { createClient } from "@/lib/supabase/server";

import { createInspection } from "../actions";

export default async function NewInspectionPage() {
  const profile = await getCurrentProfile();
  if (!profile || !canManageFleet(profile.role)) {
    return (
      <PagePlaceholder
        icon={ClipboardCheck}
        title="New Inspection"
        description="Your role doesn't have permission to record inspections."
      />
    );
  }

  const supabase = await createClient();
  const [vehicles, drivers] = await Promise.all([getVehicles(supabase), getDrivers(supabase)]);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New Inspection</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Check vehicle condition before problems become operational failures.
        </p>
      </div>
      <InspectionForm
        action={createInspection}
        vehicles={vehicles.map((v) => ({ id: v.id, unitNumber: v.unit_number }))}
        drivers={drivers.map((d) => ({ id: d.id, fullName: d.full_name }))}
      />
    </div>
  );
}
