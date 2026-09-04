"use client";

import { Fuel, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { VoidFuelDialog } from "@/components/fuel/void-fuel-dialog";
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
import type { FuelTransactionListItem } from "@/lib/data/fuel";
import type { FuelAnomaly } from "@/lib/domain/fuel-anomaly";
import { DATE_RANGE_PRESET_LABEL, type DateRangePreset } from "@/lib/domain/date-range";
import type { FuelSummary } from "@/lib/domain/fuel-summary";
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

export function FuelExplorer({
  transactions,
  summary,
  anomaliesByTransactionId,
  preset,
  vehicles,
  drivers,
  vendors,
  canManage,
}: {
  transactions: FuelTransactionListItem[];
  summary: FuelSummary;
  anomaliesByTransactionId: Record<string, FuelAnomaly[]>;
  preset: DateRangePreset;
  vehicles: { id: string; unitNumber: string }[];
  drivers: { id: string; fullName: string }[];
  vendors: { id: string; name: string }[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState("");
  const [driverFilter, setDriverFilter] = useState("");
  const [vendorFilter, setVendorFilter] = useState("");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return transactions.filter((t) => {
      if (vehicleFilter && t.vehicle_id !== vehicleFilter) return false;
      if (driverFilter && t.driver_id !== driverFilter) return false;
      if (vendorFilter && t.vendor_id !== vendorFilter) return false;
      if (query) {
        const haystack = [t.vendor_name, t.vendor?.name, t.reference_number, t.notes]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [transactions, search, vehicleFilter, driverFilter, vendorFilter]);

  function goToPreset(next: DateRangePreset) {
    router.push(`/finance/fuel?range=${next}`);
  }

  function goToCustom() {
    if (!customStart || !customEnd) return;
    router.push(`/finance/fuel?range=custom&start=${customStart}&end=${customEnd}`);
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

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <SummaryCard label="Total Fuel Cost" value={formatCurrency(summary.totalCost, summary.currency)} />
        <SummaryCard label="Total Liters" value={`${summary.totalLiters.toLocaleString()} L`} />
        <SummaryCard
          label="Avg Price / Liter"
          value={
            summary.averagePricePerLiter !== null
              ? formatCurrency(summary.averagePricePerLiter, summary.currency)
              : "—"
          }
        />
        <SummaryCard
          label="Fuel Cost / km"
          value={summary.costPerKm !== null ? formatCurrency(summary.costPerKm, summary.currency) : "Insufficient data"}
        />
        <SummaryCard label="Fuel Transactions" value={String(summary.transactionCount)} />
        <SummaryCard label="Vehicles Fueled" value={String(summary.vehiclesFueled)} />
      </div>

      <div className="flex flex-col gap-3">
        <div className="relative max-w-sm">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vendor, reference, notes…"
            className="pl-8"
          />
        </div>
        <div className="flex flex-wrap gap-2">
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
            <Fuel className="text-muted-foreground size-8" />
            <p className="text-muted-foreground max-w-sm text-sm">
              {transactions.length === 0
                ? "No fuel transactions recorded in this range."
                : "No fuel transactions match these filters."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Trip</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Liters</TableHead>
                <TableHead>Price / L</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Odometer</TableHead>
                <TableHead>Receipt</TableHead>
                <TableHead>Recorded By</TableHead>
                <TableHead>Flags</TableHead>
                {canManage ? <TableHead className="w-8" aria-label="Actions" /> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => {
                const anomalies = anomaliesByTransactionId[t.id] ?? [];
                return (
                  <TableRow key={t.id}>
                    <TableCell className="text-xs">{formatDate(t.occurred_at)}</TableCell>
                    <TableCell>{t.vehicle ? `Unit ${t.vehicle.unit_number}` : "—"}</TableCell>
                    <TableCell>{t.driver?.full_name ?? "—"}</TableCell>
                    <TableCell>{t.trip ? t.trip.trip_number : "Unassigned"}</TableCell>
                    <TableCell>{t.vendor?.name ?? t.vendor_name ?? "Unknown"}</TableCell>
                    <TableCell>{Number(t.volume_liters).toLocaleString()} L</TableCell>
                    <TableCell>
                      {t.price_per_liter !== null ? formatCurrency(Number(t.price_per_liter), t.currency) : "—"}
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(Number(t.total_amount), t.currency)}</TableCell>
                    <TableCell>
                      {t.odometer_km !== null ? `${Number(t.odometer_km).toLocaleString()} km` : "—"}
                    </TableCell>
                    <TableCell>{t.receipt_url ? "On file" : "—"}</TableCell>
                    <TableCell>{t.recorded_by_profile?.full_name ?? "—"}</TableCell>
                    <TableCell>
                      {anomalies.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {anomalies.map((a, i) => (
                            <Badge key={i} variant="status-delayed" title={a.description}>
                              Review Recommended
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    {canManage ? (
                      <TableCell>
                        <VoidFuelDialog transactionId={t.id} />
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
