import { DispatchBoard } from "@/components/dispatch/dispatch-board";
import { getCurrentProfile } from "@/lib/data/profile";
import { getDispatchTrips } from "@/lib/data/trips";
import { canManageFleet } from "@/lib/domain/permissions";
import { createClient } from "@/lib/supabase/server";

export default async function DispatchPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const trips = await getDispatchTrips(supabase);
  const canManage = profile ? canManageFleet(profile.role) : false;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dispatch</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Every trip that&apos;s still operationally open, grouped by where it is in the workflow.
        </p>
      </div>

      {trips.length === 0 ? (
        <div className="text-muted-foreground rounded-lg border border-dashed py-16 text-center text-sm">
          No open trips. Everything scheduled has been delivered, completed, or cancelled.
        </div>
      ) : (
        <DispatchBoard trips={trips} canManage={canManage} />
      )}
    </div>
  );
}
