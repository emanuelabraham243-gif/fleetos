import { DisputesList } from "@/components/disputes/disputes-list";
import { getDisputesList } from "@/lib/data/disputes";
import { createClient } from "@/lib/supabase/server";

export default async function DisputesPage() {
  const supabase = await createClient();
  const disputes = await getDisputesList(supabase);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Disputes</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Disputes raised over deliveries, fuel, damage claims, or payments.
        </p>
      </div>

      <DisputesList disputes={disputes} />
    </div>
  );
}
