"use client";

import { AlertTriangle, ClipboardList, Truck, Wrench } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
import type {
  DashboardIssueItem,
  DashboardWorkOrderItem,
  MaintenanceDashboard,
  MaintenanceSummary,
  ScheduleWithDue,
} from "@/lib/data/maintenance";
import { formatDueText } from "@/lib/days-until";
import {
  MAINTENANCE_ISSUE_SEVERITY_LABEL,
  MAINTENANCE_ISSUE_STATUS_LABEL,
  WORK_ORDER_STATUS_LABEL,
} from "@/lib/i18n/labels";
import { formatDate } from "@/lib/format-time";
import { cn } from "@/lib/utils";

type SummaryFilter = "vehiclesDue" | "dueSoon" | "overdue" | "inMaintenance" | "openIssues" | "openWorkOrders";

function ScheduleRow({ item }: { item: ScheduleWithDue }) {
  const { schedule, vehicle, due } = item;
  const parts: string[] = [];
  if (due.remainingKm !== null) {
    parts.push(due.remainingKm >= 0 ? `${due.remainingKm.toLocaleString()} km remaining` : `${Math.abs(due.remainingKm).toLocaleString()} km overdue`);
  }
  if (due.remainingDays !== null) {
    parts.push(formatDueText(due.remainingDays, "Due"));
  }
  if (parts.length === 0 && due.mileageStatus === "UNKNOWN") {
    parts.push("Mileage status: UNKNOWN");
  }

  return (
    <div className="flex items-center justify-between rounded-lg border p-3 text-sm">
      <div>
        <p className="font-medium">Unit {vehicle.unit_number}</p>
        <p className="text-muted-foreground text-xs">{schedule.title}</p>
      </div>
      <div className="text-right">
        <Badge variant={due.status === "OVERDUE" ? "destructive" : "outline"}>{due.status ?? "UNKNOWN"}</Badge>
        <p className="text-muted-foreground mt-1 text-xs">{parts.join(" · ") || "—"}</p>
      </div>
    </div>
  );
}

function IssueRow({ issue, onClick }: { issue: DashboardIssueItem; onClick: () => void }) {
  return (
    <div className="flex cursor-pointer items-start justify-between gap-3 rounded-lg border p-3 text-sm" onClick={onClick}>
      <div>
        <p className="font-medium">
          {issue.vehicle ? `Unit ${issue.vehicle.unit_number}` : "Unassigned vehicle"} — {issue.title}
        </p>
        <p className="text-muted-foreground text-xs">
          {MAINTENANCE_ISSUE_STATUS_LABEL[issue.status]} · Reported {formatDate(issue.reported_at)}
        </p>
      </div>
      <Badge variant={issue.severity === "critical" ? "destructive" : "outline"} className="capitalize">
        {MAINTENANCE_ISSUE_SEVERITY_LABEL[issue.severity]}
      </Badge>
    </div>
  );
}

function WorkOrderRow({ wo, onClick }: { wo: DashboardWorkOrderItem; onClick: () => void }) {
  return (
    <TableRow className="cursor-pointer" onClick={onClick}>
      <TableCell className="font-medium">WO-{wo.id.slice(0, 8)}</TableCell>
      <TableCell>{wo.vehicle ? `Unit ${wo.vehicle.unit_number}` : "—"}</TableCell>
      <TableCell>{wo.title}</TableCell>
      <TableCell>
        <Badge variant="outline">{WORK_ORDER_STATUS_LABEL[wo.status]}</Badge>
      </TableCell>
    </TableRow>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card className="border-dashed">
      <CardContent className="text-muted-foreground py-8 text-center text-sm">{message}</CardContent>
    </Card>
  );
}

export function MaintenanceExplorer({
  summary,
  dashboard,
}: {
  summary: MaintenanceSummary;
  dashboard: MaintenanceDashboard;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<SummaryFilter | null>(null);

  const cards: { key: SummaryFilter; label: string; value: number }[] = [
    { key: "vehiclesDue", label: "Vehicles Due", value: summary.vehiclesDue },
    { key: "dueSoon", label: "Due Soon", value: summary.dueSoon },
    { key: "overdue", label: "Overdue", value: summary.overdue },
    { key: "inMaintenance", label: "In Maintenance", value: summary.inMaintenance },
    { key: "openIssues", label: "Open Issues", value: summary.openIssues },
    { key: "openWorkOrders", label: "Open Work Orders", value: summary.openWorkOrders },
  ];

  function toggle(key: SummaryFilter) {
    setFilter((current) => (current === key ? null : key));
  }

  const showDue = filter === null || filter === "vehiclesDue" || filter === "dueSoon";
  const showOverdue = filter === null || filter === "overdue";
  const showInMaintenance = filter === "inMaintenance";
  const showIssues = filter === null || filter === "openIssues";
  const showWorkOrders = filter === null || filter === "openWorkOrders";

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {cards.map((card) => (
          <button key={card.key} type="button" onClick={() => toggle(card.key)} className="text-left">
            <Card
              className={cn(
                "hover:bg-accent/50 cursor-pointer transition-colors",
                filter === card.key && "ring-primary ring-2",
              )}
            >
              <CardContent className="flex flex-col gap-1">
                <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  {card.label}
                </span>
                <span className="text-2xl font-semibold tabular-nums">{card.value}</span>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>

      {showInMaintenance ? (
        <div>
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold tracking-wide uppercase">
            <Truck className="size-4" /> Vehicles In Maintenance
          </h2>
          {dashboard.vehiclesInMaintenance.length === 0 ? (
            <EmptyState message="No vehicles currently in maintenance." />
          ) : (
            <Card>
              <CardContent className="flex flex-col gap-2">
                {dashboard.vehiclesInMaintenance.map((v) => (
                  <div
                    key={v.id}
                    className="hover:bg-accent/50 flex cursor-pointer items-center justify-between rounded-md p-2 text-sm"
                    onClick={() => router.push(`/vehicles/${v.id}`)}
                  >
                    <span className="font-medium">Unit {v.unit_number}</span>
                    <span className="text-muted-foreground">{v.license_plate ?? "—"}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      ) : null}

      {showDue ? (
        <div>
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold tracking-wide uppercase">
            <Wrench className="size-4" /> Maintenance Due
          </h2>
          {dashboard.dueSoon.length === 0 ? (
            <EmptyState message="No vehicles approaching a scheduled service." />
          ) : (
            <div className="flex flex-col gap-2">
              {dashboard.dueSoon.map((item) => (
                <ScheduleRow key={item.schedule.id} item={item} />
              ))}
            </div>
          )}
        </div>
      ) : null}

      {showOverdue ? (
        <div>
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold tracking-wide uppercase">
            <AlertTriangle className="size-4" /> Overdue
          </h2>
          {dashboard.overdue.length === 0 ? (
            <EmptyState message="Nothing overdue." />
          ) : (
            <div className="flex flex-col gap-2">
              {dashboard.overdue.map((item) => (
                <ScheduleRow key={item.schedule.id} item={item} />
              ))}
            </div>
          )}
        </div>
      ) : null}

      {showIssues ? (
        <div>
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold tracking-wide uppercase">
            <AlertTriangle className="size-4" /> Open Issues
          </h2>
          {dashboard.openIssues.length === 0 ? (
            <EmptyState message="No open maintenance issues." />
          ) : (
            <div className="flex flex-col gap-2">
              {dashboard.openIssues.map((issue) => (
                <IssueRow key={issue.id} issue={issue} onClick={() => router.push(`/maintenance/issues/${issue.id}`)} />
              ))}
            </div>
          )}
        </div>
      ) : null}

      {showWorkOrders ? (
        <div>
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold tracking-wide uppercase">
            <ClipboardList className="size-4" /> Work Orders
          </h2>
          {dashboard.openWorkOrders.length === 0 ? (
            <EmptyState message="No open work orders." />
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Work Order</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboard.openWorkOrders.map((wo) => (
                    <WorkOrderRow key={wo.id} wo={wo} onClick={() => router.push(`/maintenance/work-orders/${wo.id}`)} />
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </div>
      ) : null}
    </div>
  );
}
