import { Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { RevenueExplorer } from "@/components/revenue/revenue-explorer";
import { resolveDateRange, type DateRangePreset } from "@/lib/domain/date-range";
import { getClients } from "@/lib/data/clients";
import { getRevenueList, getRevenueSummary } from "@/lib/data/revenue";
import { getCurrentProfile } from "@/lib/data/profile";
import { canManageFleet } from "@/lib/domain/permissions";
import { createClient } from "@/lib/supabase/server";

const VALID_PRESETS: DateRangePreset[] = ["today", "this_week", "this_month", "last_month", "custom"];

export default async function RevenuePage({
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

  const [revenue, summary, clients] = await Promise.all([
    getRevenueList(supabase, { dateRange }),
    getRevenueSummary(supabase, { dateRange }),
    getClients(supabase),
  ]);

  const canManage = profile ? canManageFleet(profile.role) : false;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Revenue</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Revenue recorded against clients, contracts, and trips.
          </p>
        </div>
        {canManage ? (
          <Button asChild>
            <Link href="/finance/revenue/new">
              <Plus />
              Record Revenue
            </Link>
          </Button>
        ) : null}
      </div>

      <RevenueExplorer
        revenue={revenue}
        summary={summary}
        preset={preset}
        clients={clients.map((c) => ({ id: c.id, name: c.name }))}
        canManage={canManage}
      />
    </div>
  );
}
