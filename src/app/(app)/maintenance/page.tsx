import { Plus, ShieldAlert, Wrench } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { MaintenanceExplorer } from "@/components/maintenance/maintenance-explorer";
import { getMaintenanceDashboard, getMaintenanceSummary } from "@/lib/data/maintenance";
import { getCurrentProfile } from "@/lib/data/profile";
import { canManageFleet } from "@/lib/domain/permissions";
import { createClient } from "@/lib/supabase/server";

export default async function MaintenancePage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const [summary, dashboard] = await Promise.all([
    getMaintenanceSummary(supabase),
    getMaintenanceDashboard(supabase),
  ]);

  const canManage = profile ? canManageFleet(profile.role) : false;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Maintenance</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Keep every vehicle safe, serviceable and ready for work.
          </p>
        </div>
        {canManage ? (
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/maintenance/issues/new">
                <ShieldAlert />
                Report Issue
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/maintenance/work-orders/new">
                <Plus />
                Create Work Order
              </Link>
            </Button>
            <Button asChild>
              <Link href="/maintenance/new">
                <Wrench />
                Schedule Maintenance
              </Link>
            </Button>
          </div>
        ) : null}
      </div>

      <MaintenanceExplorer summary={summary} dashboard={dashboard} />
    </div>
  );
}
