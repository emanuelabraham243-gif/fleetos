import { Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { SchedulesList } from "@/components/maintenance/schedules-list";
import { getMaintenanceSchedulesList } from "@/lib/data/maintenance";
import { getCurrentProfile } from "@/lib/data/profile";
import { canManageFleet } from "@/lib/domain/permissions";
import { createClient } from "@/lib/supabase/server";

export default async function MaintenanceSchedulesPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const schedules = await getMaintenanceSchedulesList(supabase);
  const canManage = profile ? canManageFleet(profile.role) : false;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Maintenance Schedules</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Recurring service rules -- time-based, mileage-based, or both.
          </p>
        </div>
        {canManage ? (
          <Button asChild>
            <Link href="/maintenance/new">
              <Plus />
              Schedule Maintenance
            </Link>
          </Button>
        ) : null}
      </div>

      <SchedulesList schedules={schedules} />
    </div>
  );
}
