import { Wrench } from "lucide-react";

import { PagePlaceholder } from "@/components/page-placeholder";
import { WorkOrderForm } from "@/components/maintenance/work-order-form";
import { getMaintenanceIssuesList } from "@/lib/data/maintenance-issues";
import { getCurrentProfile, getOrgMembers } from "@/lib/data/profile";
import { getVehicles } from "@/lib/data/vehicles";
import { getVendors } from "@/lib/data/vendors";
import { isOpenIssueStatus } from "@/lib/domain/maintenance-issue";
import { canManageFleet } from "@/lib/domain/permissions";
import { createClient } from "@/lib/supabase/server";

import { createWorkOrder } from "../actions";

export default async function CreateWorkOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ vehicle_id?: string; issue_id?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile || !canManageFleet(profile.role)) {
    return (
      <PagePlaceholder
        icon={Wrench}
        title="Create Work Order"
        description="Your role doesn't have permission to create work orders."
      />
    );
  }

  const params = await searchParams;
  const supabase = await createClient();
  const [vehicles, issues, vendors, members] = await Promise.all([
    getVehicles(supabase),
    getMaintenanceIssuesList(supabase),
    getVendors(supabase),
    getOrgMembers(supabase),
  ]);

  const openIssues = issues.filter((i) => isOpenIssueStatus(i.status));

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Create Work Order</h1>
        <p className="text-muted-foreground mt-1 text-sm">Open the operational repair workflow for a vehicle.</p>
      </div>
      <WorkOrderForm
        action={createWorkOrder}
        vehicles={vehicles.map((v) => ({ id: v.id, unitNumber: v.unit_number }))}
        issues={openIssues.map((i) => ({ id: i.id, title: i.title, vehicleId: i.vehicle_id }))}
        vendors={vendors.map((v) => ({ id: v.id, name: v.name }))}
        members={members.map((m) => ({ id: m.id, fullName: m.full_name }))}
        defaultVehicleId={params.vehicle_id}
        defaultIssueId={params.issue_id}
      />
    </div>
  );
}
