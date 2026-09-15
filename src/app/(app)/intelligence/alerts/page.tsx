import { AttentionRequired } from "@/components/command-center/attention-required";
import { Card, CardContent } from "@/components/ui/card";
import { getAttentionItems } from "@/lib/data/attention";
import { buildFleetBoard } from "@/lib/data/fleet";
import { getActiveTrips } from "@/lib/data/trips";
import { getVehicles } from "@/lib/data/vehicles";
import { createClient } from "@/lib/supabase/server";

export default async function AlertsPage() {
  const supabase = await createClient();
  const [vehicles, activeTrips] = await Promise.all([getVehicles(supabase), getActiveTrips(supabase)]);
  const fleetBoard = buildFleetBoard(vehicles, activeTrips);
  const attentionItems = await getAttentionItems(supabase, fleetBoard);

  const criticalCount = attentionItems.filter((i) => i.severity === "critical").length;
  const warningCount = attentionItems.filter((i) => i.severity === "warning").length;
  const infoCount = attentionItems.filter((i) => i.severity === "info").length;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Alerts</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          System-surfaced anomalies, such as a GPS feed going offline or a threshold being crossed --
          every item here is evidence for a human to act on, never an automated conclusion.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Critical</span>
            <span className="text-2xl font-semibold tabular-nums">{criticalCount}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Warning</span>
            <span className="text-2xl font-semibold tabular-nums">{warningCount}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Info</span>
            <span className="text-2xl font-semibold tabular-nums">{infoCount}</span>
          </CardContent>
        </Card>
      </div>

      <AttentionRequired items={attentionItems} />
    </div>
  );
}
