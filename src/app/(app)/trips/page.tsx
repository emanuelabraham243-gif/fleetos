import { Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { TripsExplorer } from "@/components/trips/trips-explorer";
import { getCurrentProfile } from "@/lib/data/profile";
import { getTripSummary, getTrips } from "@/lib/data/trips";
import { canManageFleet } from "@/lib/domain/permissions";
import { createClient } from "@/lib/supabase/server";

export default async function TripsPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const [trips, summary] = await Promise.all([getTrips(supabase), getTripSummary(supabase)]);

  const canCreate = profile ? canManageFleet(profile.role) : false;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Trips</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Plan, schedule, and track trips from origin to final stop.
          </p>
        </div>
        {canCreate ? (
          <Button asChild>
            <Link href="/trips/new">
              <Plus />
              New Trip
            </Link>
          </Button>
        ) : null}
      </div>

      <TripsExplorer trips={trips} summary={summary} />
    </div>
  );
}
