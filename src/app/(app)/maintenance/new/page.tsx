import { Wrench } from "lucide-react";

import { PagePlaceholder } from "@/components/page-placeholder";
import { ScheduleForm } from "@/components/maintenance/schedule-form";
import { getCurrentProfile } from "@/lib/data/profile";
import { getVehicles } from "@/lib/data/vehicles";
import { canManageFleet } from "@/lib/domain/permissions";
import { createClient } from "@/lib/supabase/server";

import { createMaintenanceSchedule } from "../actions";

export default async function ScheduleMaintenancePage() {
  const profile = await getCurrentProfile();
  if (!profile || !canManageFleet(profile.role)) {
    return (
      <PagePlaceholder
        icon={Wrench}
        title="Schedule Maintenance"
        description="Your role doesn't have permission to schedule maintenance."
      />
    );
  }

  const supabase = await createClient();
  const vehicles = await getVehicles(supabase);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Schedule Maintenance</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Set a recurring service rule for a vehicle -- time-based, mileage-based, or both.
        </p>
      </div>
      <ScheduleForm
        action={createMaintenanceSchedule}
        vehicles={vehicles.map((v) => ({ id: v.id, unitNumber: v.unit_number }))}
        submitLabel="Create Schedule"
      />
    </div>
  );
}
