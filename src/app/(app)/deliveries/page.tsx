import { DeliveriesExplorer } from "@/components/deliveries/deliveries-explorer";
import { getDeliveries, getDeliverySummary } from "@/lib/data/deliveries";
import { createClient } from "@/lib/supabase/server";

export default async function DeliveriesPage() {
  const supabase = await createClient();

  const [deliveries, summary] = await Promise.all([
    getDeliveries(supabase),
    getDeliverySummary(supabase),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Deliveries</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Every delivery across all trips, from dispatch to confirmation.
        </p>
      </div>

      <DeliveriesExplorer deliveries={deliveries} summary={summary} />
    </div>
  );
}
