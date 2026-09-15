import { BarChart3 } from "lucide-react";

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
import { getDeliveryOutcomeBreakdown, getFleetAnalytics } from "@/lib/data/analytics";
import { getVehicles } from "@/lib/data/vehicles";
import { formatCurrency } from "@/lib/format-currency";
import { DELIVERY_STATUS_LABEL } from "@/lib/i18n/labels";
import { createClient } from "@/lib/supabase/server";

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const vehicles = await getVehicles(supabase);

  const [analytics, deliveryOutcomes] = await Promise.all([
    getFleetAnalytics(supabase, vehicles.map((v) => ({ id: v.id, unit_number: v.unit_number }))),
    getDeliveryOutcomeBreakdown(supabase),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Trends and calculated figures across the fleet -- every number here is derived from
          recorded transactions, never a projection or an assumed average. A vehicle with too
          little data shows &quot;Insufficient data,&quot; never a guess.
        </p>
      </div>

      <div>
        <h3 className="text-muted-foreground mb-2 text-sm font-semibold tracking-wide uppercase">
          Per-Vehicle Cost &amp; Efficiency
        </h3>
        <Card className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle</TableHead>
                <TableHead>Cost / km</TableHead>
                <TableHead>Fuel (L/100km)</TableHead>
                <TableHead>Maintenance Cost</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Profit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analytics.map((row) => (
                <TableRow key={row.vehicleId}>
                  <TableCell className="font-medium">Unit {row.unitNumber}</TableCell>
                  <TableCell>
                    {row.costPerKm !== null ? formatCurrency(row.costPerKm, row.currency) : "Insufficient data"}
                  </TableCell>
                  <TableCell>{row.litersPer100Km !== null ? `${row.litersPer100Km} L/100km` : "Insufficient data"}</TableCell>
                  <TableCell>
                    {row.maintenanceCost !== null ? formatCurrency(row.maintenanceCost, row.currency) : "No data yet"}
                  </TableCell>
                  <TableCell>
                    {row.totalRevenue !== null ? formatCurrency(row.totalRevenue, row.currency) : "Not recorded"}
                  </TableCell>
                  <TableCell className="font-medium">
                    {row.profit !== null ? formatCurrency(row.profit, row.currency) : "Not available"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      <div>
        <h3 className="text-muted-foreground mb-2 text-sm font-semibold tracking-wide uppercase">
          Delivery Outcomes
        </h3>
        {deliveryOutcomes.total === 0 ? (
          <Card className="border-dashed">
            <CardContent className="text-muted-foreground py-10 text-center text-sm">
              No deliveries recorded yet.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col gap-3 py-4">
              {deliveryOutcomes.breakdown
                .sort((a, b) => b.count - a.count)
                .map((row) => (
                  <div key={row.status} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{DELIVERY_STATUS_LABEL[row.status]}</Badge>
                      <span className="text-sm">
                        {row.count} of {deliveryOutcomes.total}
                      </span>
                    </div>
                    <div className="bg-muted h-2 w-48 overflow-hidden rounded-full">
                      <div className="bg-primary h-full" style={{ width: `${row.percentage}%` }} />
                    </div>
                    <span className="text-muted-foreground w-14 text-right text-xs tabular-nums">
                      {row.percentage}%
                    </span>
                  </div>
                ))}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="text-muted-foreground flex items-center gap-2 text-xs">
        <BarChart3 className="size-3.5" />
        Figures reflect all recorded history, not a rolling window.
      </div>
    </div>
  );
}
