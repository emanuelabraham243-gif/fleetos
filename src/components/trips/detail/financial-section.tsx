import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format-currency";
import type { TripFinancialSummary } from "@/lib/data/trip-finance";

function MetricCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border p-3">
      <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</span>
      <span className="text-xl font-semibold">{value}</span>
      {hint ? <span className="text-muted-foreground text-xs">{hint}</span> : null}
    </div>
  );
}

export function FinancialSection({ summary }: { summary: TripFinancialSummary }) {
  const format = (value: number | null) =>
    value === null ? "No data yet" : formatCurrency(value, summary.currency);

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricCard label="Revenue" value={format(summary.revenue)} hint="Recorded against this trip" />
          <MetricCard label="Fuel cost" value={format(summary.fuelCost)} hint="Fuel linked to this trip" />
          <MetricCard
            label="Other expenses"
            value={format(summary.otherExpensesCost)}
            hint="Expenses linked to this trip"
          />
          <MetricCard label="Total cost" value={format(summary.totalCost)} />
        </div>

        {summary.revenue === null ? (
          <p className="text-muted-foreground border-t pt-3 text-sm">
            Cost recorded: {summary.totalCost !== null ? formatCurrency(summary.totalCost, summary.currency) : "0"} /
            Revenue: Not recorded / Profit: Not available
          </p>
        ) : (
          <div className="border-t pt-3">
            <MetricCard label="Current margin" value={format(summary.margin)} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
