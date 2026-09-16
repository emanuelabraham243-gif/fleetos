import { Card, CardContent } from "@/components/ui/card";
import type { DeliveryOutcomeBreakdown } from "@/lib/data/analytics";
import type { VehicleHistoryEvent } from "@/lib/data/vehicle-history";
import type { VehicleFinancialSummary } from "@/lib/data/vehicle-finance";
import type { FuelConsumptionMetrics } from "@/lib/domain/fuel-consumption";
import { formatCurrency } from "@/lib/format-currency";
import { formatDateTime } from "@/lib/format-time";
import { DELIVERY_STATUS_LABEL } from "@/lib/i18n/labels";

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border p-3">
      <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</span>
      <span className="text-xl font-semibold">{value}</span>
    </div>
  );
}

function VehiclePerformanceSection({
  financials,
  fuelConsumption,
  deliveryOutcomes,
}: {
  financials: VehicleFinancialSummary;
  fuelConsumption: FuelConsumptionMetrics;
  deliveryOutcomes: { total: number; breakdown: DeliveryOutcomeBreakdown[] };
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <p className="text-sm font-medium">Vehicle Performance</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricCard
            label="Cost / km"
            value={financials.costPerKm !== null ? formatCurrency(financials.costPerKm, financials.currency) : "No data yet"}
          />
          <MetricCard
            label="Profit"
            value={financials.profit !== null ? formatCurrency(financials.profit, financials.currency) : "No data yet"}
          />
          <MetricCard
            label="Fuel efficiency"
            value={fuelConsumption.litersPer100Km !== null ? `${fuelConsumption.litersPer100Km.toFixed(1)} L/100km` : "No data yet"}
          />
          <MetricCard label="Deliveries" value={String(deliveryOutcomes.total)} />
        </div>

        {deliveryOutcomes.total > 0 ? (
          <div className="border-t pt-3">
            <h3 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
              Delivery Outcomes
            </h3>
            <div className="flex flex-col gap-1">
              {deliveryOutcomes.breakdown.map((row) => (
                <div key={row.status} className="flex items-center justify-between text-sm">
                  <span>{DELIVERY_STATUS_LABEL[row.status]}</span>
                  <span className="text-muted-foreground">
                    {row.count} ({row.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function HistoryTab({
  events,
  financials,
  fuelConsumption,
  deliveryOutcomes,
}: {
  events: VehicleHistoryEvent[];
  financials: VehicleFinancialSummary;
  fuelConsumption: FuelConsumptionMetrics;
  deliveryOutcomes: { total: number; breakdown: DeliveryOutcomeBreakdown[] };
}) {
  return (
    <div className="flex flex-col gap-6">
      <VehiclePerformanceSection
        financials={financials}
        fuelConsumption={fuelConsumption}
        deliveryOutcomes={deliveryOutcomes}
      />

      {events.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="text-muted-foreground py-10 text-center text-sm">
            No history recorded for this vehicle yet.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col gap-4">
            {events.map((event) => (
              <div key={event.id} className="flex gap-3 text-sm">
                <span className="text-muted-foreground w-32 shrink-0 text-xs tabular-nums">
                  {formatDateTime(event.timestamp)}
                </span>
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
                <div>
                  <p>{event.description}</p>
                  {event.actorName ? (
                    <p className="text-muted-foreground text-xs">by {event.actorName}</p>
                  ) : null}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
