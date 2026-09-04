import { Receipt } from "lucide-react";

import { PagePlaceholder } from "@/components/page-placeholder";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { getDrivers } from "@/lib/data/drivers";
import { getCurrentProfile } from "@/lib/data/profile";
import { getDispatchTrips } from "@/lib/data/trips";
import { getVehicles } from "@/lib/data/vehicles";
import { getVendors } from "@/lib/data/vendors";
import { canManageFleet } from "@/lib/domain/permissions";
import { createClient } from "@/lib/supabase/server";

import { createExpense } from "../actions";

export default async function AddExpensePage() {
  const profile = await getCurrentProfile();
  if (!profile || !canManageFleet(profile.role)) {
    return (
      <PagePlaceholder
        icon={Receipt}
        title="Add Expense"
        description="Your role doesn't have permission to record expenses."
      />
    );
  }

  const supabase = await createClient();
  const [vehicles, drivers, trips, vendors] = await Promise.all([
    getVehicles(supabase),
    getDrivers(supabase),
    getDispatchTrips(supabase),
    getVendors(supabase),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Add Expense</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Record an operating expense. New expenses start Recorded -- approval is a separate step.
        </p>
      </div>
      <ExpenseForm
        action={createExpense}
        vehicles={vehicles.map((v) => ({ id: v.id, unitNumber: v.unit_number }))}
        drivers={drivers.map((d) => ({ id: d.id, fullName: d.full_name }))}
        trips={trips.map((t) => ({ id: t.id, tripNumber: t.trip_number, vehicleId: t.vehicle_id }))}
        vendors={vendors.map((v) => ({ id: v.id, name: v.name }))}
      />
    </div>
  );
}
