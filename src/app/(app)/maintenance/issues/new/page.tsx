import { ShieldAlert } from "lucide-react";

import { PagePlaceholder } from "@/components/page-placeholder";
import { IssueForm } from "@/components/maintenance/issue-form";
import { getDrivers } from "@/lib/data/drivers";
import { getCurrentProfile } from "@/lib/data/profile";
import { getVehicles } from "@/lib/data/vehicles";
import { canManageFleet } from "@/lib/domain/permissions";
import { createClient } from "@/lib/supabase/server";

import { createMaintenanceIssue } from "../actions";

export default async function ReportMaintenanceIssuePage() {
  const profile = await getCurrentProfile();
  if (!profile || !canManageFleet(profile.role)) {
    return (
      <PagePlaceholder
        icon={ShieldAlert}
        title="Report Issue"
        description="Your role doesn't have permission to report maintenance issues."
      />
    );
  }

  const supabase = await createClient();
  const [vehicles, drivers] = await Promise.all([getVehicles(supabase), getDrivers(supabase)]);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Report Issue</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Record what was observed. FleetOS never diagnoses the problem for you.
        </p>
      </div>
      <IssueForm
        action={createMaintenanceIssue}
        vehicles={vehicles.map((v) => ({ id: v.id, unitNumber: v.unit_number }))}
        drivers={drivers.map((d) => ({ id: d.id, fullName: d.full_name }))}
      />
    </div>
  );
}
