import { Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { WorkOrdersList } from "@/components/maintenance/work-orders-list";
import { getCurrentProfile } from "@/lib/data/profile";
import { getWorkOrdersList } from "@/lib/data/work-orders";
import { canManageFleet } from "@/lib/domain/permissions";
import { createClient } from "@/lib/supabase/server";

export default async function WorkOrdersPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const workOrders = await getWorkOrdersList(supabase);
  const canManage = profile ? canManageFleet(profile.role) : false;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Work Orders</h1>
          <p className="text-muted-foreground mt-1 text-sm">The operational maintenance workflow.</p>
        </div>
        {canManage ? (
          <Button asChild>
            <Link href="/maintenance/work-orders/new">
              <Plus />
              Create Work Order
            </Link>
          </Button>
        ) : null}
      </div>

      <WorkOrdersList workOrders={workOrders} />
    </div>
  );
}
