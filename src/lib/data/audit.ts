import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { DateRange } from "@/lib/domain/date-range";
import type { Database } from "@/lib/supabase/database.types";

const AUDIT_LOG_SELECT = "*, actor:profiles(id, full_name)";

export type AuditLogEntry = Database["public"]["Tables"]["audit_logs"]["Row"] & {
  actor: Pick<Database["public"]["Tables"]["profiles"]["Row"], "id" | "full_name"> | null;
};

export interface AuditLogFilters {
  dateRange: DateRange;
  tableName?: string;
}

const LIST_LIMIT = 200;

/** The `/system/audit-log` browse view -- every change to a critical record, newest first, capped so the page stays fast against a table that only ever grows. */
export async function getAuditLogList(
  supabase: SupabaseClient<Database>,
  filters: AuditLogFilters,
): Promise<AuditLogEntry[]> {
  let query = supabase
    .from("audit_logs")
    .select(AUDIT_LOG_SELECT)
    .gte("created_at", filters.dateRange.startIso)
    .lt("created_at", filters.dateRange.endIso)
    .order("created_at", { ascending: false })
    .limit(LIST_LIMIT);

  if (filters.tableName) query = query.eq("table_name", filters.tableName);

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to load audit log: ${error.message}`);
  }
  return data;
}

/** Distinct table names actually present in the audit log, for the filter dropdown -- never a hardcoded list that could drift from what's really audited. */
export async function getAuditedTableNames(supabase: SupabaseClient<Database>): Promise<string[]> {
  const { data, error } = await supabase.from("audit_logs").select("table_name").limit(5000);
  if (error) {
    throw new Error(`Failed to load audited table names: ${error.message}`);
  }
  return Array.from(new Set((data ?? []).map((row) => row.table_name))).sort();
}
