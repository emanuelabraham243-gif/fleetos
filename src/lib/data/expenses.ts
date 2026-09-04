import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { DateRange } from "@/lib/domain/date-range";
import type { Database } from "@/lib/supabase/database.types";

export type VehicleExpense = Database["public"]["Tables"]["expenses"]["Row"] & {
  recorded_by_profile: Pick<Database["public"]["Tables"]["profiles"]["Row"], "id" | "full_name"> | null;
};

export async function getVehicleExpenses(
  supabase: SupabaseClient<Database>,
  vehicleId: string,
): Promise<VehicleExpense[]> {
  const { data, error } = await supabase
    .from("expenses")
    .select("*, recorded_by_profile:profiles!expenses_created_by_fkey(id, full_name)")
    .eq("vehicle_id", vehicleId)
    .order("occurred_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load expenses: ${error.message}`);
  }

  return data;
}

// ============================================================================
// /expenses page: list, summary, and approval-workflow support -- everything
// below this line is new in Phase 6. `VehicleExpense`/`getVehicleExpenses`
// above are unchanged so the existing Vehicle Detail Expenses tab keeps
// working exactly as it did.
// ============================================================================

const EXPENSE_LIST_SELECT =
  "*, vehicle:vehicles(id, unit_number, license_plate), driver:drivers(id, full_name), trip:trips(id, trip_number), vendor:vendors(id, name), recorded_by_profile:profiles!expenses_created_by_fkey(id, full_name), approved_by_profile:profiles!expenses_approved_by_fkey(id, full_name)";

export type ExpenseListItem = Database["public"]["Tables"]["expenses"]["Row"] & {
  vehicle: Pick<Database["public"]["Tables"]["vehicles"]["Row"], "id" | "unit_number" | "license_plate"> | null;
  driver: Pick<Database["public"]["Tables"]["drivers"]["Row"], "id" | "full_name"> | null;
  trip: Pick<Database["public"]["Tables"]["trips"]["Row"], "id" | "trip_number"> | null;
  vendor: Pick<Database["public"]["Tables"]["vendors"]["Row"], "id" | "name"> | null;
  recorded_by_profile: Pick<Database["public"]["Tables"]["profiles"]["Row"], "id" | "full_name"> | null;
  approved_by_profile: Pick<Database["public"]["Tables"]["profiles"]["Row"], "id" | "full_name"> | null;
};

export type ExpenseCategory = Database["public"]["Enums"]["expense_category"];

export interface ExpenseListFilters {
  dateRange: DateRange;
  category?: ExpenseCategory;
  vehicleId?: string;
  driverId?: string;
  vendorId?: string;
  /** Matches against description, vendor_name, reference_number (case-insensitive). */
  search?: string;
}

function applyExpenseFilters<
  T extends {
    eq: (column: string, value: string) => T;
    gte: (column: string, value: string) => T;
    lt: (column: string, value: string) => T;
    or: (filters: string) => T;
  },
>(query: T, filters: ExpenseListFilters): T {
  let q: T = query
    .eq("status", "active")
    .gte("occurred_at", filters.dateRange.startIso)
    .lt("occurred_at", filters.dateRange.endIso);
  if (filters.category) q = q.eq("category", filters.category);
  if (filters.vehicleId) q = q.eq("vehicle_id", filters.vehicleId);
  if (filters.driverId) q = q.eq("driver_id", filters.driverId);
  if (filters.vendorId) q = q.eq("vendor_id", filters.vendorId);
  if (filters.search) {
    const term = filters.search.trim();
    if (term.length > 0) {
      const escaped = term.replace(/[%_]/g, (c) => `\\${c}`);
      q = q.or(
        `description.ilike.%${escaped}%,vendor_name.ilike.%${escaped}%,reference_number.ilike.%${escaped}%`,
      );
    }
  }
  return q;
}

/**
 * The `/expenses` list query -- every active (non-voided, non-superseded)
 * expense in the caller's organization within the filtered date range,
 * newest first. A voided row's approval_status still reads whatever it
 * was at void time; `computeExpenseDisplayStatus` (lib/domain/expense.ts)
 * is what turns `status`+`approval_status` into the single VOIDED word the
 * spec's table column expects -- this query itself doesn't collapse them.
 */
export async function getExpensesList(
  supabase: SupabaseClient<Database>,
  filters: ExpenseListFilters,
): Promise<ExpenseListItem[]> {
  const query = applyExpenseFilters(supabase.from("expenses").select(EXPENSE_LIST_SELECT), filters).order(
    "occurred_at",
    { ascending: false },
  );

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to load expenses: ${error.message}`);
  }
  return data;
}

export interface ExpenseSummary {
  transactionCount: number;
  totalAmount: number | null;
  currency: string;
  pendingReviewCount: number;
  approvedCount: number;
  rejectedCount: number;
}

/** Summary cards for `/expenses` -- same filters as the list, so the cards and table always agree on what's in view. */
export async function getExpenseSummary(
  supabase: SupabaseClient<Database>,
  filters: ExpenseListFilters,
): Promise<ExpenseSummary> {
  const { data, error } = await applyExpenseFilters(
    supabase.from("expenses").select("amount, currency, approval_status"),
    filters,
  );
  if (error) {
    throw new Error(`Failed to load expense summary: ${error.message}`);
  }

  const rows = data ?? [];
  const totalAmount = rows.length > 0 ? rows.reduce((sum, r) => sum + Number(r.amount), 0) : null;

  return {
    transactionCount: rows.length,
    totalAmount: totalAmount !== null ? Math.round(totalAmount * 100) / 100 : null,
    currency: rows[0]?.currency ?? "ETB",
    pendingReviewCount: rows.filter((r) => r.approval_status === "PENDING_REVIEW").length,
    approvedCount: rows.filter((r) => r.approval_status === "APPROVED").length,
    rejectedCount: rows.filter((r) => r.approval_status === "REJECTED").length,
  };
}

/** Single-expense read used by the approve/reject/void/correct actions to check current state before writing. */
export async function getExpenseById(
  supabase: SupabaseClient<Database>,
  expenseId: string,
): Promise<Database["public"]["Tables"]["expenses"]["Row"] | null> {
  const { data, error } = await supabase.from("expenses").select("*").eq("id", expenseId).maybeSingle();
  if (error) {
    throw new Error(`Failed to load expense: ${error.message}`);
  }
  return data;
}
