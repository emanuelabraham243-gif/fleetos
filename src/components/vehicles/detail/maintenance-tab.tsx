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
import { daysUntil, formatDueText } from "@/lib/days-until";
import { formatCurrency } from "@/lib/format-currency";
import { formatDate } from "@/lib/format-time";

function ScheduleLine({
  title,
  intervalKm,
  intervalDays,
  nextDueAt,
  nextDueOdometerKm,
}: {
  title: string;
  intervalKm: number | null;
  intervalDays: number | null;
  nextDueAt: string | null;
  nextDueOdometerKm: number | null;
}) {
  const parts: string[] = [];
  if (nextDueOdometerKm !== null) parts.push(`${nextDueOdometerKm.toLocaleString()} km`);
  if (nextDueAt !== null) parts.push(formatDueText(daysUntil(nextDueAt), "Service due"));
  const basis = [
    intervalKm !== null ? `every ${intervalKm.toLocaleString()} km` : null,
    intervalDays !== null ? `every ${intervalDays} days` : null,
  ]
    .filter(Boolean)
    .join(" or ");

  return (
    <div className="flex items-center justify-between rounded-lg border p-3 text-sm">
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-muted-foreground text-xs">{basis}</p>
      </div>
      <p className="text-right font-medium">{parts.join(" · ") || "—"}</p>
    </div>
  );
}

export function MaintenanceTab({ maintenance }: { maintenance: VehicleMaintenance }) {
  const { schedules, issues, workOrders } = maintenance;
  const activeSchedules = schedules.filter((s) => s.is_active);
  const openIssues = issues.filter((i) => i.status !== "resolved" && i.status !== "wont_fix");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-muted-foreground mb-2 text-sm font-semibold tracking-wide uppercase">
          Scheduled Maintenance
        </h3>
        {activeSchedules.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="text-muted-foreground py-6 text-center text-sm">
              No maintenance schedules configured for this vehicle.
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {activeSchedules.map((schedule) => (
              <ScheduleLine
                key={schedule.id}
                title={schedule.title}
                intervalKm={schedule.interval_km !== null ? Number(schedule.interval_km) : null}
                intervalDays={schedule.interval_days}
                nextDueAt={schedule.next_due_at}
                nextDueOdometerKm={
                  schedule.next_due_odometer_km !== null ? Number(schedule.next_due_odometer_km) : null
                }
              />
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-muted-foreground mb-2 text-sm font-semibold tracking-wide uppercase">
          Open Issues
        </h3>
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
                <div key={issue.id} className="flex items-start justify-between gap-3 text-sm">
                  <div>
                    <p className="font-medium">{issue.title}</p>
                    {issue.description ? (
                      <p className="text-muted-foreground text-xs">{issue.description}</p>
                    ) : null}
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {issue.severity}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      <div>
        <h3 className="text-muted-foreground mb-2 text-sm font-semibold tracking-wide uppercase">
          Work Orders
        </h3>
        {workOrders.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="text-muted-foreground py-6 text-center text-sm">
              No work orders on file.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Opened</TableHead>
                  <TableHead>Closed</TableHead>
                  <TableHead>Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workOrders.map((wo) => (
                  <TableRow key={wo.id}>
                    <TableCell className="font-medium">{wo.title}</TableCell>
                    <TableCell>{wo.vendor?.name ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {wo.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {formatDate(wo.opened_at)}
                    </TableCell>
                    <TableCell className="text-xs">
                      {wo.closed_at ? formatDate(wo.closed_at) : "—"}
                    </TableCell>
                    <TableCell>
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
