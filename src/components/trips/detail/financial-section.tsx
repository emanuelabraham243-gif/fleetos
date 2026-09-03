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
      <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <MetricCard label="Revenue" value={format(summary.revenue)} hint="Recorded against this trip" />
        <MetricCard
          label="Fuel cost"
          value={format(summary.fuelCostDuringTrip)}
          hint="Recorded for this vehicle during the trip window"
        />
        <MetricCard
          label="Other expenses"
          value={format(summary.expensesDuringTrip)}
          hint="Recorded for this vehicle during the trip window"
        />
      </CardContent>
    </Card>
  );
}
