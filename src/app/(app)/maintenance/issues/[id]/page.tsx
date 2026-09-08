import { notFound } from "next/navigation";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { IssueStatusDialog } from "@/components/maintenance/issue-status-dialog";
import { getAttachmentsWithUrls } from "@/lib/data/attachments";
import { getMaintenanceIssueById, getWorkOrdersForIssue } from "@/lib/data/maintenance-issues";
import { getCurrentProfile } from "@/lib/data/profile";
import { nextIssueStatuses } from "@/lib/domain/maintenance-issue";
import { canManageFleet } from "@/lib/domain/permissions";
import {
  MAINTENANCE_ISSUE_SEVERITY_LABEL,
  MAINTENANCE_ISSUE_STATUS_LABEL,
  MAINTENANCE_ISSUE_TYPE_LABEL,
  WORK_ORDER_STATUS_LABEL,
} from "@/lib/i18n/labels";
import { formatFullDateTime } from "@/lib/format-time";
import { createClient } from "@/lib/supabase/server";

export default async function MaintenanceIssueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const issue = await getMaintenanceIssueById(supabase, id);
  if (!issue) {
    notFound();
  }

  const [profile, attachments, workOrders] = await Promise.all([
    getCurrentProfile(),
    getAttachmentsWithUrls(supabase, "maintenance_issue", id),
    getWorkOrdersForIssue(supabase, id),
  ]);

  const canManage = profile ? canManageFleet(profile.role) : false;
  const availableTransitions = nextIssueStatuses(issue.status);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{issue.title}</h1>
            <Badge variant="outline">{MAINTENANCE_ISSUE_STATUS_LABEL[issue.status]}</Badge>
            <Badge variant={issue.severity === "critical" ? "destructive" : "outline"} className="capitalize">
              {MAINTENANCE_ISSUE_SEVERITY_LABEL[issue.severity]}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            {issue.vehicle ? (
              <Link href={`/vehicles/${issue.vehicle.id}`} className="hover:underline">
                Unit {issue.vehicle.unit_number}
              </Link>
            ) : (
              "Unassigned vehicle"
            )}{" "}
            · {MAINTENANCE_ISSUE_TYPE_LABEL[issue.issue_type]}
          </p>
        </div>
        {canManage ? (
          <div className="flex flex-wrap gap-2">
            {issue.vehicle ? (
              <Button asChild variant="outline" size="sm">
                <Link href={`/maintenance/work-orders/new?vehicle_id=${issue.vehicle.id}&issue_id=${issue.id}`}>
                  Create Work Order
                </Link>
              </Button>
            ) : null}
            {availableTransitions.map((status) => (
              <IssueStatusDialog key={status} issueId={issue.id} toStatus={status} />
            ))}
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
              <p className="text-sm">{issue.description}</p>
            </div>
            {issue.status === "DISMISSED" && issue.dismissed_reason ? (
              <div>
                <h3 className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
                  Dismissed Reason
                </h3>
                <p className="text-sm">{issue.dismissed_reason}</p>
              </div>
            ) : null}
            {attachments.length > 0 ? (
              <div>
                <h3 className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">Photos</h3>
                <div className="flex flex-wrap gap-2">
                  {attachments.map((a) =>
                    a.signedUrl ? (
                      <a key={a.id} href={a.signedUrl} target="_blank" rel="noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element -- signed Storage URL, not a static asset next/image can optimize */}
                        <img src={a.signedUrl} alt={a.file_name ?? "Attachment"} className="h-24 w-24 rounded-md object-cover" />
                      </a>
                    ) : null,
                  )}
                </div>
              </div>
            ) : null}
            {workOrders.length > 0 ? (
              <div>
                <h3 className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
                  Work Orders
                </h3>
                <div className="flex flex-col gap-1">
                  {workOrders.map((wo) => (
                    <Link
                      key={wo.id}
                      href={`/maintenance/work-orders/${wo.id}`}
                      className="flex items-center justify-between rounded-md border p-2 text-sm hover:bg-accent/50"
                    >
                      <span>{wo.title}</span>
                      <Badge variant="outline">{WORK_ORDER_STATUS_LABEL[wo.status]}</Badge>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <span className="text-muted-foreground">Reported</span>
            <span>{formatFullDateTime(issue.reported_at)}</span>
            <span className="text-muted-foreground">Reported by</span>
            <span>{issue.reported_by_profile?.full_name ?? "—"}</span>
            <span className="text-muted-foreground">Driver</span>
            <span>{issue.driver?.full_name ?? "—"}</span>
            <span className="text-muted-foreground">Mileage at report</span>
            <span>{issue.odometer_km !== null ? `${Number(issue.odometer_km).toLocaleString()} km` : "Not recorded"}</span>
            {issue.resolved_at ? (
              <>
                <span className="text-muted-foreground">Resolved</span>
                <span>{formatFullDateTime(issue.resolved_at)}</span>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
