import { Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { FuelExplorer } from "@/components/fuel/fuel-explorer";
import { resolveDateRange, type DateRangePreset } from "@/lib/domain/date-range";
import { detectFuelAnomalies } from "@/lib/domain/fuel-anomaly";
import { getDrivers } from "@/lib/data/drivers";
import { getFuelSummary, getFuelTransactionsList } from "@/lib/data/fuel";
import { getCurrentProfile } from "@/lib/data/profile";
import { getVehicles } from "@/lib/data/vehicles";
import { getVendors } from "@/lib/data/vendors";
import { canManageFleet } from "@/lib/domain/permissions";
import { createClient } from "@/lib/supabase/server";

const VALID_PRESETS: DateRangePreset[] = ["today", "this_week", "this_month", "last_month", "custom"];

export default async function FuelPage({
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

  const [transactions, summary, vehicles, drivers, vendors] = await Promise.all([
    getFuelTransactionsList(supabase, { dateRange }),
    getFuelSummary(supabase, { dateRange }),
    getVehicles(supabase),
    getDrivers(supabase),
    getVendors(supabase),
  ]);

  const byVehicle = new Map<string, typeof transactions>();
  for (const t of transactions) {
    const list = byVehicle.get(t.vehicle_id);
    if (list) list.push(t);
    else byVehicle.set(t.vehicle_id, [t]);
  }
  const anomaliesByTransactionId = new Map<string, ReturnType<typeof detectFuelAnomalies>>();
  for (const vehicleTransactions of byVehicle.values()) {
    const anomalies = detectFuelAnomalies(
      vehicleTransactions.map((t) => ({
        id: t.id,
        occurred_at: t.occurred_at,
        odometer_km: t.odometer_km,
        volume_liters: Number(t.volume_liters),
        receipt_url: t.receipt_url,
      })),
    );
    for (const a of anomalies) {
      const list = anomaliesByTransactionId.get(a.transactionId);
      if (list) list.push(a);
      else anomaliesByTransactionId.set(a.transactionId, [a]);
    }
  }

  const canManage = profile ? canManageFleet(profile.role) : false;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Fuel</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Fuel purchases and consumption against each vehicle&apos;s own baseline.
          </p>
        </div>
        {canManage ? (
          <Button asChild>
            <Link href="/finance/fuel/new">
              <Plus />
              Record Fuel
            </Link>
          </Button>
        ) : null}
      </div>

      <FuelExplorer
        transactions={transactions}
        summary={summary}
        anomaliesByTransactionId={Object.fromEntries(anomaliesByTransactionId)}
        preset={preset}
        vehicles={vehicles.map((v) => ({ id: v.id, unitNumber: v.unit_number }))}
        drivers={drivers.map((d) => ({ id: d.id, fullName: d.full_name }))}
        vendors={vendors.map((v) => ({ id: v.id, name: v.name }))}
        canManage={canManage}
      />
    </div>
  );
}
