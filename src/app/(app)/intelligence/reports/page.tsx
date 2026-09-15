import { getMaintenanceCostBreakdown } from "@/lib/data/analytics";
import { getExpenseSummary } from "@/lib/data/expenses";
import { getFuelSummary } from "@/lib/data/fuel";
import { getRevenueSummary } from "@/lib/data/revenue";
import { getVehicles } from "@/lib/data/vehicles";
import { Card, CardContent } from "@/components/ui/card";
import { resolveDateRange } from "@/lib/domain/date-range";
import { formatCurrency } from "@/lib/format-currency";
import { VEHICLE_STATUS_LABEL } from "@/lib/i18n/labels";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

function ReportCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-muted-foreground mb-2 text-sm font-semibold tracking-wide uppercase">{title}</h3>
      <Card>
        <CardContent className="grid grid-cols-2 gap-x-6 gap-y-3 py-4 sm:grid-cols-3">{children}</CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="text-lg font-semibold tabular-nums">{value}</span>
    </div>
  );
}

export default async function ReportsPage() {
  const supabase = await createClient();
  const thisMonth = resolveDateRange("this_month");

  const [revenue, expenses, fuel, maintenanceCost, vehicles] = await Promise.all([
    getRevenueSummary(supabase, { dateRange: thisMonth }),
    getExpenseSummary(supabase, { dateRange: thisMonth }),
    getFuelSummary(supabase, { dateRange: thisMonth }),
    getMaintenanceCostBreakdown(supabase),
    getVehicles(supabase),
  ]);

  const currency = revenue.totalAmount !== null ? revenue.currency : expenses.currency;
  const netThisMonth =
    revenue.totalAmount !== null
      ? revenue.totalAmount - (expenses.totalAmount ?? 0) - fuel.totalCost
      : null;

  const vehiclesByStatus = new Map<string, number>();
  for (const v of vehicles) {
    vehiclesByStatus.set(v.status, (vehiclesByStatus.get(v.status) ?? 0) + 1);
  }
  const statusOrder: Database["public"]["Enums"]["vehicle_status"][] = [
    "active",
    "maintenance",
    "out_of_service",
    "sold",
    "retired",
  ];

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Generated operational and financial reports -- computed on demand from recorded
          transactions, never a static export that can drift from the live data.
        </p>
      </div>

      <ReportCard title="Monthly Financial Summary (This Month)">
        <Stat
          label="Revenue"
          value={revenue.totalAmount !== null ? formatCurrency(revenue.totalAmount, revenue.currency) : "Not recorded"}
        />
        <Stat
          label="Expenses"
          value={expenses.totalAmount !== null ? formatCurrency(expenses.totalAmount, expenses.currency) : "None"}
        />
        <Stat label="Fuel Cost" value={fuel.transactionCount > 0 ? formatCurrency(fuel.totalCost, fuel.currency) : "None"} />
        <Stat
          label="Net (Revenue - Expenses - Fuel)"
          value={netThisMonth !== null ? formatCurrency(netThisMonth, currency) : "Not available"}
        />
      </ReportCard>

      <ReportCard title="Fleet Utilization">
        {statusOrder.map((status) => (
          <Stat key={status} label={VEHICLE_STATUS_LABEL[status]} value={String(vehiclesByStatus.get(status) ?? 0)} />
        ))}
        <Stat label="Total Fleet" value={String(vehicles.length)} />
      </ReportCard>

      <ReportCard title="Maintenance Cost Report (All Time, Completed Work Orders)">
        <Stat label="Preventive" value={formatCurrency(maintenanceCost.preventiveCost, maintenanceCost.currency)} />
        <Stat label="Corrective" value={formatCurrency(maintenanceCost.correctiveCost, maintenanceCost.currency)} />
        <Stat label="Total" value={formatCurrency(maintenanceCost.totalCost, maintenanceCost.currency)} />
      </ReportCard>
    </div>
  );
}
