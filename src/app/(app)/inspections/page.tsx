import { Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { InspectionsList } from "@/components/inspections/inspections-list";
import { getInspectionsList, getIssuesCreatedCountByInspection } from "@/lib/data/inspections";
import { getCurrentProfile } from "@/lib/data/profile";
import { canManageFleet } from "@/lib/domain/permissions";
import { createClient } from "@/lib/supabase/server";

export default async function InspectionsPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const inspections = await getInspectionsList(supabase);
  const issuesCreatedMap = await getIssuesCreatedCountByInspection(
    supabase,
    inspections.map((i) => i.id),
  );

  const canManage = profile ? canManageFleet(profile.role) : false;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Inspections</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Check vehicle condition before problems become operational failures.
          </p>
        </div>
        {canManage ? (
          <Button asChild>
            <Link href="/inspections/new">
              <Plus />
              New Inspection
            </Link>
          </Button>
        ) : null}
      </div>

      <InspectionsList
        inspections={inspections}
        issuesCreatedByInspection={Object.fromEntries(issuesCreatedMap)}
      />
    </div>
  );
}
