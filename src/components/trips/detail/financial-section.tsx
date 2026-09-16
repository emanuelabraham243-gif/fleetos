import { Card, CardContent } from "@/components/ui/card";
import { RecordRevenueDialog } from "@/components/trips/detail/record-revenue-dialog";
import { formatCurrency } from "@/lib/format-currency";
import { formatDate } from "@/lib/format-time";
import type { TripFinancialLineItem, TripFinancialSummary } from "@/lib/data/trip-finance";

function MetricCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border p-3">
      <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</span>
      <span className="text-xl font-semibold">{value}</span>
      {hint ? <span className="text-muted-foreground text-xs">{hint}</span> : null}
    </div>
  );
}

function LineItemList({ title, items }: { title: string; items: TripFinancialLineItem[] }) {
  return (
    <div>
      <h3 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">{title}</h3>
      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm">No itemized records yet.</p>
      ) : (
        <div className="flex flex-col gap-1">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
              <div>
                <p>{item.description}</p>
                <p className="text-muted-foreground text-xs">{formatDate(item.occurredAt)}</p>
              </div>
              <span className="font-medium">{formatCurrency(item.amount, item.currency)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function FinancialSection({
  summary,
  tripId,
  clientId,
  canManage,
}: {
  summary: TripFinancialSummary;
  tripId: string;
  clientId: string | null;
  canManage: boolean;
}) {
  const format = (value: number | null) =>
    value === null ? "No data yet" : formatCurrency(value, summary.currency);

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Trip Expense / Income / Profit Summary</p>
          {canManage ? (
            <RecordRevenueDialog tripId={tripId} clientId={clientId} currency={summary.currency} />
          ) : null}
        </div>

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
            <MetricCard label="Net profit" value={format(summary.margin)} />
          </div>
        )}

        <div className="flex flex-col gap-4 border-t pt-3">
          <LineItemList title="Revenue" items={summary.revenueItems} />
          <LineItemList title="Fuel" items={summary.fuelItems} />
          <LineItemList title="Other Expenses" items={summary.expenseItems} />
        </div>
      </CardContent>
    </Card>
  );
}
