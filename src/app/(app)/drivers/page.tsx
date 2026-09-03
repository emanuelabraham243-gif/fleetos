import { Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { DriversExplorer } from "@/components/drivers/drivers-explorer";
import { getDriverBoard, summarizeDrivers } from "@/lib/data/driver-board";
import { getCurrentProfile } from "@/lib/data/profile";
import { canManageFleet } from "@/lib/domain/permissions";
import { createClient } from "@/lib/supabase/server";

export default async function DriversPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const board = await getDriverBoard(supabase);
  const summary = summarizeDrivers(board);
  const canAdd = profile ? canManageFleet(profile.role) : false;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Drivers</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage drivers, assignments, documents and operational history.
          </p>
        </div>
        {canAdd ? (
          <Button asChild>
            <Link href="/drivers/new">
              <Plus />
              Add Driver
            </Link>
          </Button>
        ) : null}
      </div>

      <DriversExplorer drivers={board} summary={summary} />
    </div>
  );
}
