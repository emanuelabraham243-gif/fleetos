import { Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { IncidentsList } from "@/components/incidents/incidents-list";
import { getIncidentsList } from "@/lib/data/incidents";
import { getCurrentProfile } from "@/lib/data/profile";
import { canManageFleet } from "@/lib/domain/permissions";
import { createClient } from "@/lib/supabase/server";

export default async function IncidentsPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const incidents = await getIncidentsList(supabase);
  const canManage = profile ? canManageFleet(profile.role) : false;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Incidents</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Recorded incidents, with evidence tagged as fact, calculation, input, interpretation, or decision.
          </p>
        </div>
        {canManage ? (
          <Button asChild>
            <Link href="/issues/incidents/new">
              <Plus />
              Report Incident
            </Link>
          </Button>
        ) : null}
      </div>

      <IncidentsList incidents={incidents} />
    </div>
  );
}
