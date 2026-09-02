import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { FuelMetrics, FuelTransaction } from "@/lib/data/fuel";
import { formatCurrency } from "@/lib/format-currency";

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border p-3">
      <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        {label}
      </span>
      <span className="text-lg font-semibold">{value}</span>
    </div>
  );
}

export function FuelTab({
  transactions,
  metrics,
}: {
  transactions: FuelTransaction[];
  metrics: FuelMetrics | null;
}) {
  if (transactions.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="text-muted-foreground py-10 text-center text-sm">
          No fuel transactions recorded.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {metrics ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <MetricCard label="Total liters" value={`${metrics.totalLiters.toLocaleString()} L`} />
          <MetricCard label="Total fuel cost" value={formatCurrency(metrics.totalCost, metrics.currency)} />
          <MetricCard
            label="Avg cost / liter"
            value={formatCurrency(metrics.averageCostPerLiter, metrics.currency)}
          />
          <MetricCard
            label="Cost / km"
            value={
              metrics.costPerKm !== null
                ? formatCurrency(metrics.costPerKm, metrics.currency)
                : "Insufficient data"
            }
          />
        </div>
      ) : null}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Liters</TableHead>
              <TableHead>Price / liter</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Odometer</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell className="text-xs">
                  {new Date(tx.occurred_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </TableCell>
                <TableCell>{tx.vendor_name ?? "—"}</TableCell>
                <TableCell>{Number(tx.volume_liters).toLocaleString()} L</TableCell>
                <TableCell>
                  {tx.price_per_liter !== null ? formatCurrency(Number(tx.price_per_liter), tx.currency) : "—"}
                </TableCell>
                <TableCell className="font-medium">
                  {formatCurrency(Number(tx.total_amount), tx.currency)}
                </TableCell>
                <TableCell>{tx.odometer_km !== null ? `${Number(tx.odometer_km).toLocaleString()} km` : "—"}</TableCell>
                <TableCell>{tx.driver?.full_name ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {tx.status !== "active" ? `(${tx.status}) ` : ""}
                  {tx.notes ?? (tx.receipt_url ? "Receipt on file" : "—")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
