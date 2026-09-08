import { notFound } from "next/navigation";
import Link from "next/link";

import { AddLaborDialog } from "@/components/maintenance/add-labor-dialog";
import { AddPartDialog } from "@/components/maintenance/add-part-dialog";
import { CompleteWorkOrderDialog } from "@/components/maintenance/complete-work-order-dialog";
import { WorkOrderStatusDialog } from "@/components/maintenance/work-order-status-dialog";
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
import { getAttachmentsWithUrls } from "@/lib/data/attachments";
import { getVehicleMaintenance } from "@/lib/data/maintenance";
import { getCurrentProfile } from "@/lib/data/profile";
import { getVendors } from "@/lib/data/vendors";
import { getWorkOrderAuditHistory, getWorkOrderById, getWorkOrderExpenses } from "@/lib/data/work-orders";
import { canManageFleet } from "@/lib/domain/permissions";
import { computeDowntime, computeWorkOrderCostBreakdown, formatDowntime, nextWorkOrderStatuses } from "@/lib/domain/work-order";
import { formatCurrency } from "@/lib/format-currency";
import { formatFullDateTime } from "@/lib/format-time";
import {
  MAINTENANCE_ISSUE_STATUS_LABEL,
  MAINTENANCE_TYPE_LABEL,
  WORK_ORDER_PRIORITY_LABEL,
  WORK_ORDER_STATUS_LABEL,
} from "@/lib/i18n/labels";
import { createClient } from "@/lib/supabase/server";

export default async function WorkOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const workOrder = await getWorkOrderById(supabase, id);
  if (!workOrder) {
    notFound();
  }

  const [profile, expenses, attachments, auditHistory, vendors, vehicleMaintenance] = await Promise.all([
    getCurrentProfile(),
    getWorkOrderExpenses(supabase, id),
    getAttachmentsWithUrls(supabase, "work_order", id),
    getWorkOrderAuditHistory(supabase, id),
    getVendors(supabase),
    getVehicleMaintenance(supabase, workOrder.vehicle_id),
  ]);

  const canManage = profile ? canManageFleet(profile.role) : false;
  const availableTransitions = nextWorkOrderStatuses(workOrder.status).filter((s) => s !== "COMPLETED");
  const canComplete = canManageFleet(profile?.role ?? "viewer") && nextWorkOrderStatuses(workOrder.status).includes("COMPLETED");

  const partsCost = workOrder.parts.reduce((sum, p) => sum + Number(p.total_cost ?? 0), 0);
  const laborCost = workOrder.labor.reduce((sum, l) => sum + Number(l.total_cost), 0);
  const otherCost = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const breakdown = computeWorkOrderCostBreakdown({ partsCost, laborCost, otherCost, currency: workOrder.currency });
  const downtime = computeDowntime(workOrder.downtime_start_at, workOrder.downtime_end_at);

  const activeSchedules = vehicleMaintenance.schedules.filter((s) => s.is_active);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">WO-{workOrder.id.slice(0, 8)}</h1>
            <Badge variant="outline">{WORK_ORDER_STATUS_LABEL[workOrder.status]}</Badge>
            <Badge variant={workOrder.priority === "CRITICAL" ? "destructive" : "outline"}>
              {WORK_ORDER_PRIORITY_LABEL[workOrder.priority]}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            {workOrder.vehicle ? (
              <Link href={`/vehicles/${workOrder.vehicle.id}`} className="hover:underline">
                Unit {workOrder.vehicle.unit_number}
              </Link>
            ) : (
              "Unassigned vehicle"
            )}{" "}
            · {workOrder.title} · {MAINTENANCE_TYPE_LABEL[workOrder.maintenance_type]}
          </p>
        </div>
        {canManage ? (
          <div className="flex flex-wrap gap-2">
            {availableTransitions.map((status) => (
              <WorkOrderStatusDialog key={status} workOrderId={workOrder.id} toStatus={status} />
            ))}
            {canComplete ? (
              <CompleteWorkOrderDialog
                workOrderId={workOrder.id}
                schedules={activeSchedules.map((s) => ({ id: s.id, title: s.title }))}
              />
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="flex flex-col gap-4">
            <div>
              <h3 className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
                Description
              </h3>
              <p className="text-sm">{workOrder.description ?? "—"}</p>
            </div>

            {workOrder.maintenance_issue ? (
              <div>
                <h3 className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
                  Originating Issue
                </h3>
                <Link
                  href={`/maintenance/issues/${workOrder.maintenance_issue.id}`}
                  className="flex items-center justify-between rounded-md border p-2 text-sm hover:bg-accent/50"
                >
                  <span>{workOrder.maintenance_issue.title}</span>
                  <Badge variant="outline">{MAINTENANCE_ISSUE_STATUS_LABEL[workOrder.maintenance_issue.status]}</Badge>
                </Link>
              </div>
            ) : null}

            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Parts</h3>
                {canManage ? <AddPartDialog workOrderId={workOrder.id} vendors={vendors.map((v) => ({ id: v.id, name: v.name }))} /> : null}
              </div>
              {workOrder.parts.length === 0 ? (
                <p className="text-muted-foreground text-sm">No parts recorded.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Part</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Unit Cost</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Supplier</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workOrder.parts.map((part) => (
                      <TableRow key={part.id}>
                        <TableCell className="font-medium">
                          {part.part_name}
                          {part.part_number ? <span className="text-muted-foreground ml-1 text-xs">({part.part_number})</span> : null}
                        </TableCell>
                        <TableCell>{Number(part.quantity).toLocaleString()}</TableCell>
                        <TableCell>{formatCurrency(Number(part.unit_cost), workOrder.currency)}</TableCell>
                        <TableCell className="font-medium">
                          {part.total_cost !== null ? formatCurrency(Number(part.total_cost), workOrder.currency) : "—"}
                        </TableCell>
                        <TableCell>{part.vendor?.name ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Labor</h3>
                {canManage ? <AddLaborDialog workOrderId={workOrder.id} vendors={vendors.map((v) => ({ id: v.id, name: v.name }))} /> : null}
              </div>
              {workOrder.labor.length === 0 ? (
                <p className="text-muted-foreground text-sm">No labor recorded.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Technician / Vendor</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Hours × Rate</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workOrder.labor.map((labor) => (
                      <TableRow key={labor.id}>
                        <TableCell className="font-medium">
                          {labor.vendor?.name ?? labor.technician_name ?? "—"}
                        </TableCell>
                        <TableCell>{labor.description ?? "—"}</TableCell>
                        <TableCell>
                          {labor.hours !== null && labor.rate !== null
                            ? `${Number(labor.hours)}h × ${formatCurrency(Number(labor.rate), workOrder.currency)}`
                            : "Fixed"}
                        </TableCell>
                        <TableCell className="font-medium">{formatCurrency(Number(labor.total_cost), workOrder.currency)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                  Linked Expenses
                </h3>
                {canManage && workOrder.vehicle ? (
                  <Link
                    href={`/finance/expenses/new?vehicle_id=${workOrder.vehicle.id}&work_order_id=${workOrder.id}`}
                    className="text-primary text-xs hover:underline"
                  >
                    Add Expense
                  </Link>
                ) : null}
              </div>
              {expenses.length === 0 ? (
                <p className="text-muted-foreground text-sm">No expenses linked.</p>
              ) : (
                <div className="flex flex-col gap-1">
                  {expenses.map((e) => (
                    <div key={e.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
                      <span>{e.description ?? e.category}</span>
                      <span className="font-medium">{formatCurrency(Number(e.amount), e.currency)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {attachments.length > 0 ? (
              <div>
                <h3 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
                  Attachments
                </h3>
                <div className="flex flex-col gap-1">
                  {attachments.map((a) => (
                    <a
                      key={a.id}
                      href={a.signedUrl ?? "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-md border p-2 text-sm hover:bg-accent/50"
                    >
                      {a.file_name}
                    </a>
                  ))}
                </div>
              </div>
            ) : null}

            {workOrder.completion_notes ? (
              <div>
                <h3 className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
                  Completion Notes
                </h3>
                <p className="text-sm">{workOrder.completion_notes}</p>
              </div>
            ) : null}

            <div>
              <h3 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
                Audit History
              </h3>
              {auditHistory.length === 0 ? (
                <p className="text-muted-foreground text-sm">No history yet.</p>
              ) : (
                <div className="flex flex-col gap-1">
                  {auditHistory.map((event) => (
                    <div key={event.id} className="flex items-center justify-between text-xs">
                      <span>{event.description}</span>
                      <span className="text-muted-foreground">
                        {formatFullDateTime(event.timestamp)}
                        {event.actorName ? ` · ${event.actorName}` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardContent className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <span className="text-muted-foreground">Vendor</span>
              <span>{workOrder.vendor?.name ?? "—"}</span>
              <span className="text-muted-foreground">Assigned to</span>
              <span>{workOrder.assigned_to_profile?.full_name ?? "—"}</span>
              <span className="text-muted-foreground">Opened</span>
              <span>{formatFullDateTime(workOrder.opened_at)}</span>
              <span className="text-muted-foreground">Started</span>
              <span>{workOrder.started_at ? formatFullDateTime(workOrder.started_at) : "—"}</span>
              <span className="text-muted-foreground">Completed</span>
              <span>{workOrder.closed_at ? formatFullDateTime(workOrder.closed_at) : "—"}</span>
              <span className="text-muted-foreground">Mileage at open</span>
              <span>{workOrder.odometer_km !== null ? `${Number(workOrder.odometer_km).toLocaleString()} km` : "—"}</span>
              <span className="text-muted-foreground">Completion mileage</span>
              <span>
                {workOrder.completion_odometer_km !== null
                  ? `${Number(workOrder.completion_odometer_km).toLocaleString()} km`
                  : "—"}
              </span>
              <span className="text-muted-foreground">Downtime</span>
              <span>{formatDowntime(downtime.hours)}</span>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-2 text-sm">
              <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Cost</h3>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Parts</span>
                <span>{formatCurrency(breakdown.partsCost, breakdown.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Labor</span>
                <span>{formatCurrency(breakdown.laborCost, breakdown.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Other</span>
                <span>{formatCurrency(breakdown.otherCost, breakdown.currency)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 font-semibold">
                <span>Total</span>
                <span>{formatCurrency(breakdown.total, breakdown.currency)}</span>
              </div>
              {workOrder.estimated_cost !== null ? (
                <div className="text-muted-foreground flex justify-between text-xs">
                  <span>Estimated</span>
                  <span>{formatCurrency(Number(workOrder.estimated_cost), breakdown.currency)}</span>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
