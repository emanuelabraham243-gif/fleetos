import { Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { IssuesList } from "@/components/maintenance/issues-list";
import { getMaintenanceIssuesList } from "@/lib/data/maintenance-issues";
import { getCurrentProfile } from "@/lib/data/profile";
import { canManageFleet } from "@/lib/domain/permissions";
import { createClient } from "@/lib/supabase/server";

export default async function MaintenanceIssuesPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const issues = await getMaintenanceIssuesList(supabase);
  const canManage = profile ? canManageFleet(profile.role) : false;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Maintenance Issues</h1>
          <p className="text-muted-foreground mt-1 text-sm">Every reported issue, open and closed.</p>
        </div>
        {canManage ? (
          <Button asChild>
            <Link href="/maintenance/issues/new">
              <Plus />
              Report Issue
            </Link>
          </Button>
        ) : null}
      </div>

      <IssuesList issues={issues} />
    </div>
  );
}
