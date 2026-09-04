import { Badge } from "@/components/ui/badge";
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
import type { FuelConsumptionMetrics } from "@/lib/domain/fuel-consumption";
import type { FuelAnomaly } from "@/lib/domain/fuel-anomaly";
import type { OdometerProvenance } from "@/lib/domain/odometer-provenance";
import { formatCurrency } from "@/lib/format-currency";
import { formatDate, formatDateTime } from "@/lib/format-time";

const ODOMETER_SOURCE_LABEL: Record<OdometerProvenance["readings"][number]["source"], string> = {
  manual: "Manual entry",
  fuel_transaction: "Fuel transaction",
  gps: "GPS",
  maintenance: "Maintenance record",
};

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
  consumption,
  anomaliesByTransactionId,
  odometerProvenance,
}: {
  transactions: FuelTransaction[];
  metrics: FuelMetrics | null;
  consumption: FuelConsumptionMetrics;
  anomaliesByTransactionId: Record<string, FuelAnomaly[]>;
  odometerProvenance: OdometerProvenance;
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
      {odometerProvenance.readings.length > 0 ? (
        <Card className={odometerProvenance.hasConflict ? "border-destructive" : undefined}>
          <CardContent className="flex flex-col gap-2 text-sm">
            <p className="font-medium">
              Odometer:{" "}
              {odometerProvenance.latest ? `${odometerProvenance.latest.odometerKm.toLocaleString()} km` : "Unknown"}
              {odometerProvenance.latest ? (
                <span className="text-muted-foreground ml-1 text-xs font-normal">
                  ({ODOMETER_SOURCE_LABEL[odometerProvenance.latest.source]}, {formatDateTime(odometerProvenance.latest.recordedAt)})
                </span>
              ) : null}
            </p>
            {odometerProvenance.hasConflict ? (
              <p className="text-destructive text-xs">
                Odometer conflict: readings from different sources disagree on order. Every reading is
                listed below -- none has been picked as correct automatically.
              </p>
            ) : null}
            <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs">
              {odometerProvenance.readings.map((r, i) => (
                <span key={i}>
                  {ODOMETER_SOURCE_LABEL[r.source]}: {r.odometerKm.toLocaleString()} km ({formatDate(r.recordedAt)})
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

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

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard
          label="Distance covered"
          value={consumption.distanceKm !== null ? `${consumption.distanceKm.toLocaleString()} km` : "Insufficient data"}
        />
        <MetricCard
          label="Consumption"
          value={consumption.litersPer100Km !== null ? `${consumption.litersPer100Km} L / 100km` : "Insufficient data"}
        />
        <MetricCard
          label="Distance / liter"
          value={consumption.kmPerLiter !== null ? `${consumption.kmPerLiter} km/L` : "Insufficient data"}
        />
        <MetricCard
          label="Liters consumed"
          value={consumption.litersConsumed !== null ? `${consumption.litersConsumed.toLocaleString()} L` : "Insufficient data"}
        />
      </div>

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
              <TableHead>Flags</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => {
              const anomalies = anomaliesByTransactionId[tx.id] ?? [];
              return (
                <TableRow key={tx.id}>
                  <TableCell className="text-xs">
                    {formatDate(tx.occurred_at)}
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
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
