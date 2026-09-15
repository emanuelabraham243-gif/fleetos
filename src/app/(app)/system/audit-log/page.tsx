import { AuditLogExplorer } from "@/components/system/audit-log-explorer";
import { getAuditedTableNames, getAuditLogList } from "@/lib/data/audit";
import { resolveDateRange, type DateRangePreset } from "@/lib/domain/date-range";
import { createClient } from "@/lib/supabase/server";

const VALID_PRESETS: DateRangePreset[] = ["today", "this_week", "this_month", "last_month", "custom"];

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; start?: string; end?: string; table?: string }>;
}) {
  const params = await searchParams;
  const preset: DateRangePreset = VALID_PRESETS.includes(params.range as DateRangePreset)
    ? (params.range as DateRangePreset)
    : "this_week";

  const dateRange =
    preset === "custom" && params.start && params.end
      ? resolveDateRange("custom", {
          startIso: new Date(params.start).toISOString(),
          endIso: new Date(new Date(params.end).getTime() + 24 * 60 * 60 * 1000).toISOString(),
        })
      : resolveDateRange(preset === "custom" ? "this_week" : preset);

  const tableNameFilter = params.table ?? "";

  const supabase = await createClient();
  const [entries, tableNames] = await Promise.all([
    getAuditLogList(supabase, { dateRange, tableName: tableNameFilter || undefined }),
    getAuditedTableNames(supabase),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Audit Log</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Every change to a critical record, with who, when, and the previous value.
        </p>
      </div>

      <AuditLogExplorer entries={entries} tableNames={tableNames} preset={preset} tableNameFilter={tableNameFilter} />
    </div>
  );
}
