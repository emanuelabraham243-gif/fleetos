import { Landmark } from "lucide-react";

import { PagePlaceholder } from "@/components/page-placeholder";
import { RevenueForm } from "@/components/revenue/revenue-form";
import { getClients } from "@/lib/data/clients";
import { getContracts } from "@/lib/data/contracts";
import { getCurrentProfile } from "@/lib/data/profile";
import { getTrips } from "@/lib/data/trips";
import { canManageFleet } from "@/lib/domain/permissions";
import { createClient } from "@/lib/supabase/server";

import { createRevenue } from "../actions";

export default async function RecordRevenuePage() {
  const profile = await getCurrentProfile();
  if (!profile || !canManageFleet(profile.role)) {
    return (
      <PagePlaceholder
        icon={Landmark}
        title="Record Revenue"
        description="Your role doesn't have permission to record revenue."
      />
    );
  }

  const supabase = await createClient();
  const [clients, contracts, trips] = await Promise.all([
    getClients(supabase),
    getContracts(supabase),
    getTrips(supabase),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Record Revenue</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Record money actually earned -- against a client, a contract, and/or a specific trip.
        </p>
      </div>
      <RevenueForm
        action={createRevenue}
        clients={clients.map((c) => ({ id: c.id, name: c.name }))}
        contracts={contracts.map((c) => ({
          id: c.id,
          contractNumber: c.contract_number,
          title: c.title,
          clientId: c.client_id,
        }))}
        trips={trips.map((t) => ({ id: t.id, tripNumber: t.trip_number, clientId: t.client_id }))}
      />
    </div>
  );
}
