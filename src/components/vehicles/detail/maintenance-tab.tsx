import Link from "next/link";

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
import type { VehicleMaintenance } from "@/lib/data/maintenance";
import { formatDueText } from "@/lib/days-until";
import { computeMaintenanceDue } from "@/lib/domain/maintenance-schedule";
import { formatCurrency } from "@/lib/format-currency";
import { formatDate } from "@/lib/format-time";
import {
  MAINTENANCE_ISSUE_SEVERITY_LABEL,
  MAINTENANCE_ISSUE_STATUS_LABEL,
  WORK_ORDER_STATUS_LABEL,
} from "@/lib/i18n/labels";

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border p-3">
      <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</span>
      <span className="text-lg font-semibold">{value}</span>
    </div>
  );
}

export function MaintenanceTab({
  maintenance,
  currentOdometerKm,
}: {
  maintenance: VehicleMaintenance;
  currentOdometerKm: number | null;
}) {
  const { schedules, issues, workOrders } = maintenance;
  const activeSchedules = schedules.filter((s) => s.is_active);
  const openIssues = issues.filter(
    (i) => i.status !== "RESOLVED" && i.status !== "CLOSED" && i.status !== "DISMISSED",
  );
  const openWorkOrders = workOrders.filter((w) => w.status !== "COMPLETED" && w.status !== "CANCELLED");
  const completedWorkOrders = workOrders
    .filter((w) => w.status === "COMPLETED")
    .sort((a, b) => new Date(b.closed_at ?? b.opened_at).getTime() - new Date(a.closed_at ?? a.opened_at).getTime());

  const dueList = activeSchedules
    .map((schedule) => ({ schedule, due: computeMaintenanceDue(schedule, currentOdometerKm) }))
    .filter(({ due }) => due.status !== null)
    .sort((a, b) => {
      const rank = { OVERDUE: 0, DUE: 1, DUE_SOON: 2, UPCOMING: 3, CANCELLED: 4 } as const;
      return rank[a.due.status!] - rank[b.due.status!];
    });
  const nextService = dueList[0] ?? null;

  const currency = workOrders[0]?.currency ?? "ETB";
  const totalMaintenanceCost = completedWorkOrders.reduce((sum, w) => sum + Number(w.total_cost ?? 0), 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-muted-foreground mb-2 text-sm font-semibold tracking-wide uppercase">Current Status</h3>
        {nextService === null ? (
          <Card className="border-dashed">
            <CardContent className="text-muted-foreground py-6 text-center text-sm">
              {activeSchedules.length === 0
                ? "No maintenance schedules configured for this vehicle."
                : "Next service cannot be calculated -- verified mileage unavailable."}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <MetricCard label="Next service" value={nextService.schedule.title} />
            <MetricCard
              label="Due date"
              value={nextService.schedule.next_due_at ? formatDate(nextService.schedule.next_due_at) : "—"}
            />
            <MetricCard
              label="Due mileage"
              value={
                nextService.schedule.next_due_odometer_km !== null
                  ? `${Number(nextService.schedule.next_due_odometer_km).toLocaleString()} km`
                  : "—"
              }
            />
            <MetricCard
              label="Current mileage"
              value={currentOdometerKm !== null ? `${currentOdometerKm.toLocaleString()} km` : "Mileage status: UNKNOWN"}
            />
            <MetricCard
              label="Remaining distance"
              value={
                nextService.due.remainingKm !== null
                  ? `${nextService.due.remainingKm.toLocaleString()} km`
                  : nextService.due.mileageStatus === "UNKNOWN"
                    ? "Mileage status: UNKNOWN"
                    : "—"
              }
            />
            <MetricCard
              label="Remaining days"
              value={
                nextService.due.remainingDays !== null
                  ? formatDueText(nextService.due.remainingDays, "Due")
                  : "—"
              }
            />
          </div>
        )}
      </div>

      <div>
        <h3 className="text-muted-foreground mb-2 text-sm font-semibold tracking-wide uppercase">Open Issues</h3>
        {openIssues.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="text-muted-foreground py-6 text-center text-sm">
              No open maintenance issues.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col gap-2">
              {openIssues.map((issue) => (
                <Link
                  key={issue.id}
                  href={`/maintenance/issues/${issue.id}`}
                  className="hover:bg-accent/50 flex items-start justify-between gap-3 rounded-md p-2 text-sm"
                >
                  <div>
                    <p className="font-medium">{issue.title}</p>
                    <p className="text-muted-foreground text-xs">{MAINTENANCE_ISSUE_STATUS_LABEL[issue.status]}</p>
                  </div>
                  <Badge variant={issue.severity === "critical" ? "destructive" : "outline"} className="capitalize">
                    {MAINTENANCE_ISSUE_SEVERITY_LABEL[issue.severity]}
                  </Badge>
                </Link>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      <div>
        <h3 className="text-muted-foreground mb-2 text-sm font-semibold tracking-wide uppercase">
          Open Work Orders
        </h3>
        {openWorkOrders.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="text-muted-foreground py-6 text-center text-sm">
              No open work orders.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col gap-2">
              {openWorkOrders.map((wo) => (
                <Link
                  key={wo.id}
                  href={`/maintenance/work-orders/${wo.id}`}
                  className="hover:bg-accent/50 flex items-center justify-between rounded-md p-2 text-sm"
                >
                  <span className="font-medium">{wo.title}</span>
                  <Badge variant="outline">{WORK_ORDER_STATUS_LABEL[wo.status]}</Badge>
                </Link>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">Maintenance History</h3>
          <span className="text-muted-foreground text-xs">
            Total cost: {completedWorkOrders.length > 0 ? formatCurrency(totalMaintenanceCost, currency) : "No data yet"}
          </span>
        </div>
        {completedWorkOrders.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="text-muted-foreground py-6 text-center text-sm">
              No maintenance history.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>Mileage</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {completedWorkOrders.map((wo) => (
                  <TableRow key={wo.id}>
                    <TableCell className="text-xs">
                      <Link href={`/maintenance/work-orders/${wo.id}`} className="hover:underline">
                        {wo.closed_at ? formatDate(wo.closed_at) : formatDate(wo.opened_at)}
                      </Link>
                    </TableCell>
                    <TableCell className="font-medium">{wo.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{WORK_ORDER_STATUS_LABEL[wo.status]}</Badge>
                    </TableCell>
                    <TableCell>
                      {wo.completion_odometer_km !== null
                        ? `${Number(wo.completion_odometer_km).toLocaleString()} km`
                        : "—"}
                    </TableCell>
                    <TableCell>{wo.vendor?.name ?? "—"}</TableCell>
                    <TableCell className="font-medium">
                      {wo.total_cost !== null ? formatCurrency(Number(wo.total_cost), wo.currency) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </div>
  );
}
