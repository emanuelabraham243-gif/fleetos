"use client";

import { Receipt, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { ReviewExpenseDialog } from "@/components/expenses/review-expense-dialog";
import { VoidExpenseDialog } from "@/components/expenses/void-expense-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ExpenseListItem } from "@/lib/data/expenses";
import { DATE_RANGE_PRESET_LABEL, type DateRangePreset } from "@/lib/domain/date-range";
import { canReviewExpense, computeExpenseDisplayStatus, type ExpenseDisplayStatus } from "@/lib/domain/expense";
import type { ExpenseSummary } from "@/lib/data/expenses";
import { EXPENSE_CATEGORY_LABEL, EXPENSE_APPROVAL_STATUS_LABEL } from "@/lib/i18n/labels";
import { formatCurrency } from "@/lib/format-currency";
import { formatDate } from "@/lib/format-time";
import type { Database } from "@/lib/supabase/database.types";

type ExpenseCategory = Database["public"]["Enums"]["expense_category"];

const PRESETS: DateRangePreset[] = ["today", "this_week", "this_month", "last_month"];

const STATUS_LABEL: Record<ExpenseDisplayStatus, string> = {
  ...EXPENSE_APPROVAL_STATUS_LABEL,
  VOIDED: "Voided",
};

const STATUS_BADGE_VARIANT: Record<ExpenseDisplayStatus, "default" | "secondary" | "destructive" | "outline"> = {
  RECORDED: "outline",
  PENDING_REVIEW: "secondary",
  APPROVED: "default",
  REJECTED: "destructive",
  VOIDED: "destructive",
};

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1">
        <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</span>
        <span className="text-2xl font-semibold tabular-nums">{value}</span>
      </CardContent>
    </Card>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="border-input bg-background h-9 rounded-md border px-2 text-sm shadow-xs"
    >
      <option value="">{label}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function ExpenseExplorer({
  expenses,
  summary,
  preset,
  vehicles,
  drivers,
  vendors,
  canManage,
}: {
  expenses: ExpenseListItem[];
  summary: ExpenseSummary;
  preset: DateRangePreset;
  vehicles: { id: string; unitNumber: string }[];
  drivers: { id: string; fullName: string }[];
  vendors: { id: string; name: string }[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState("");
  const [driverFilter, setDriverFilter] = useState("");
  const [vendorFilter, setVendorFilter] = useState("");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return expenses.filter((e) => {
      if (categoryFilter && e.category !== categoryFilter) return false;
      if (vehicleFilter && e.vehicle_id !== vehicleFilter) return false;
      if (driverFilter && e.driver_id !== driverFilter) return false;
      if (vendorFilter && e.vendor_id !== vendorFilter) return false;
      if (query) {
        const haystack = [e.description, e.vendor_name, e.vendor?.name, e.reference_number]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [expenses, search, categoryFilter, vehicleFilter, driverFilter, vendorFilter]);

  function goToPreset(next: DateRangePreset) {
    router.push(`/finance/expenses?range=${next}`);
  }

  function goToCustom() {
    if (!customStart || !customEnd) return;
    router.push(`/finance/expenses?range=custom&start=${customStart}&end=${customEnd}`);
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => goToPreset(p)}
            className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
              preset === p ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent/50"
            }`}
          >
            {DATE_RANGE_PRESET_LABEL[p]}
          </button>
        ))}
        <div className="flex items-center gap-1">
          <Input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="h-9 w-36"
            aria-label="Custom range start"
          />
          <span className="text-muted-foreground text-xs">to</span>
          <Input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="h-9 w-36"
            aria-label="Custom range end"
          />
          <button
            type="button"
            onClick={goToCustom}
            className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
              preset === "custom" ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent/50"
            }`}
          >
            Apply
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <SummaryCard
          label="Total Expenses"
          value={summary.totalAmount !== null ? formatCurrency(summary.totalAmount, summary.currency) : "No data yet"}
        />
        <SummaryCard label="Transactions" value={String(summary.transactionCount)} />
        <SummaryCard label="Pending Review" value={String(summary.pendingReviewCount)} />
        <SummaryCard label="Approved" value={String(summary.approvedCount)} />
      </div>

      <div className="flex flex-col gap-3">
        <div className="relative max-w-sm">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search description, vendor, reference…"
            className="pl-8"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterSelect
            label="Category"
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={(Object.keys(EXPENSE_CATEGORY_LABEL) as ExpenseCategory[]).map((c) => ({
              value: c,
              label: EXPENSE_CATEGORY_LABEL[c],
            }))}
          />
          <FilterSelect
            label="Vehicle"
            value={vehicleFilter}
            onChange={setVehicleFilter}
            options={vehicles.map((v) => ({ value: v.id, label: `Unit ${v.unitNumber}` }))}
          />
          <FilterSelect
            label="Driver"
            value={driverFilter}
            onChange={setDriverFilter}
            options={drivers.map((d) => ({ value: d.id, label: d.fullName }))}
          />
          <FilterSelect
            label="Vendor"
            value={vendorFilter}
            onChange={setVendorFilter}
            options={vendors.map((v) => ({ value: v.id, label: v.name }))}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Receipt className="text-muted-foreground size-8" />
            <p className="text-muted-foreground max-w-sm text-sm">
              {expenses.length === 0
                ? "No expenses recorded in this range."
                : "No expenses match these filters."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Trip</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Receipt</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Recorded By</TableHead>
                {canManage ? <TableHead className="w-40" aria-label="Actions" /> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((e) => {
                const displayStatus = computeExpenseDisplayStatus(e.status, e.approval_status);
                return (
                  <TableRow key={e.id}>
                    <TableCell className="text-xs">{formatDate(e.occurred_at)}</TableCell>
                    <TableCell>{EXPENSE_CATEGORY_LABEL[e.category]}</TableCell>
                    <TableCell className="max-w-[16rem] truncate">{e.description}</TableCell>
                    <TableCell>{e.vehicle ? `Unit ${e.vehicle.unit_number}` : "—"}</TableCell>
                    <TableCell>{e.driver?.full_name ?? "—"}</TableCell>
                    <TableCell>{e.trip ? e.trip.trip_number : "Unassigned"}</TableCell>
                    <TableCell>{e.vendor?.name ?? e.vendor_name ?? "Unknown"}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(Number(e.amount), e.currency)}</TableCell>
                    <TableCell className="text-xs">{e.payment_method ?? "—"}</TableCell>
                    <TableCell>{e.receipt_url ? "On file" : "—"}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_BADGE_VARIANT[displayStatus]}>{STATUS_LABEL[displayStatus]}</Badge>
                    </TableCell>
                    <TableCell>{e.recorded_by_profile?.full_name ?? "—"}</TableCell>
                    {canManage ? (
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {canReviewExpense(e.approval_status) && e.status === "active" ? (
                            <>
                              <ReviewExpenseDialog expenseId={e.id} decision="APPROVED" />
                              <ReviewExpenseDialog expenseId={e.id} decision="REJECTED" />
                            </>
                          ) : null}
                          {e.status === "active" ? <VoidExpenseDialog expenseId={e.id} /> : null}
                        </div>
                      </TableCell>
                    ) : null}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
