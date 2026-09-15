"use client";

import { Landmark, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { VoidRevenueDialog } from "@/components/revenue/void-revenue-dialog";
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
import type { RevenueListItem, RevenueSummary } from "@/lib/data/revenue";
import { DATE_RANGE_PRESET_LABEL, type DateRangePreset } from "@/lib/domain/date-range";
import { formatCurrency } from "@/lib/format-currency";
import { formatDate } from "@/lib/format-time";

const PRESETS: DateRangePreset[] = ["today", "this_week", "this_month", "last_month"];

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

export function RevenueExplorer({
  revenue,
  summary,
  preset,
  clients,
  canManage,
}: {
  revenue: RevenueListItem[];
  summary: RevenueSummary;
  preset: DateRangePreset;
  clients: { id: string; name: string }[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return revenue.filter((r) => {
      if (clientFilter && r.client_id !== clientFilter) return false;
      if (query) {
        const haystack = [r.description, r.client?.name, r.contract?.contract_number, r.trip?.trip_number]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [revenue, search, clientFilter]);

  function goToPreset(next: DateRangePreset) {
    router.push(`/finance/revenue?range=${next}`);
  }

  function goToCustom() {
    if (!customStart || !customEnd) return;
    router.push(`/finance/revenue?range=custom&start=${customStart}&end=${customEnd}`);
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

      <div className="grid grid-cols-2 gap-4 md:grid-cols-2">
        <SummaryCard
          label="Total Revenue"
          value={summary.totalAmount !== null ? formatCurrency(summary.totalAmount, summary.currency) : "No data yet"}
        />
        <SummaryCard label="Transactions" value={String(summary.transactionCount)} />
      </div>

      <div className="flex flex-col gap-3">
        <div className="relative max-w-sm">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search description, client, contract, trip…"
            className="pl-8"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterSelect
            label="Client"
            value={clientFilter}
            onChange={setClientFilter}
            options={clients.map((c) => ({ value: c.id, label: c.name }))}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Landmark className="text-muted-foreground size-8" />
            <p className="text-muted-foreground max-w-sm text-sm">
              {revenue.length === 0 ? "No revenue recorded in this range." : "No revenue matches these filters."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Contract</TableHead>
                <TableHead>Trip</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Recorded By</TableHead>
                {canManage ? <TableHead className="w-24" aria-label="Actions" /> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs">{formatDate(r.occurred_at)}</TableCell>
                  <TableCell className="max-w-[16rem] truncate">{r.description}</TableCell>
                  <TableCell>{r.client?.name ?? "—"}</TableCell>
                  <TableCell>{r.contract?.contract_number ?? "—"}</TableCell>
                  <TableCell>{r.trip?.trip_number ?? "Unassigned"}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(Number(r.amount), r.currency)}</TableCell>
                  <TableCell>{r.recorded_by_profile?.full_name ?? "—"}</TableCell>
                  {canManage ? (
                    <TableCell>
                      <VoidRevenueDialog revenueId={r.id} />
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
