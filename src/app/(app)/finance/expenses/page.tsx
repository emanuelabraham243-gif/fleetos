import { Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ExpenseExplorer } from "@/components/expenses/expense-explorer";
import { resolveDateRange, type DateRangePreset } from "@/lib/domain/date-range";
import { getDrivers } from "@/lib/data/drivers";
import { getExpenseSummary, getExpensesList } from "@/lib/data/expenses";
import { getCurrentProfile } from "@/lib/data/profile";
import { getVehicles } from "@/lib/data/vehicles";
import { getVendors } from "@/lib/data/vendors";
import { canManageFleet } from "@/lib/domain/permissions";
import { createClient } from "@/lib/supabase/server";

const VALID_PRESETS: DateRangePreset[] = ["today", "this_week", "this_month", "last_month", "custom"];

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; start?: string; end?: string }>;
}) {
  const params = await searchParams;
  const preset: DateRangePreset = VALID_PRESETS.includes(params.range as DateRangePreset)
    ? (params.range as DateRangePreset)
    : "this_month";

  const dateRange =
    preset === "custom" && params.start && params.end
      ? resolveDateRange("custom", {
          startIso: new Date(params.start).toISOString(),
          endIso: new Date(new Date(params.end).getTime() + 24 * 60 * 60 * 1000).toISOString(),
        })
      : resolveDateRange(preset === "custom" ? "this_month" : preset);

  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const [expenses, summary, vehicles, drivers, vendors] = await Promise.all([
    getExpensesList(supabase, { dateRange }),
    getExpenseSummary(supabase, { dateRange }),
    getVehicles(supabase),
    getDrivers(supabase),
    getVendors(supabase),
  ]);

  const canManage = profile ? canManageFleet(profile.role) : false;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Operating expenses by vehicle, driver, and category.
          </p>
        </div>
        {canManage ? (
          <Button asChild>
            <Link href="/finance/expenses/new">
              <Plus />
              Add Expense
            </Link>
          </Button>
        ) : null}
      </div>

      <ExpenseExplorer
        expenses={expenses}
        summary={summary}
        preset={preset}
        vehicles={vehicles.map((v) => ({ id: v.id, unitNumber: v.unit_number }))}
        drivers={drivers.map((d) => ({ id: d.id, fullName: d.full_name }))}
        vendors={vendors.map((v) => ({ id: v.id, name: v.name }))}
        canManage={canManage}
      />
    </div>
  );
}
