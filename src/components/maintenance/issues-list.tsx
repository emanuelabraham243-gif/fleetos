"use client";

import { useRouter } from "next/navigation";

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
import type { MaintenanceIssueDetail } from "@/lib/data/maintenance-issues";
import { formatDate } from "@/lib/format-time";
import {
  MAINTENANCE_ISSUE_SEVERITY_LABEL,
  MAINTENANCE_ISSUE_STATUS_LABEL,
  MAINTENANCE_ISSUE_TYPE_LABEL,
} from "@/lib/i18n/labels";

export function IssuesList({ issues }: { issues: MaintenanceIssueDetail[] }) {
  const router = useRouter();

  if (issues.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="text-muted-foreground py-16 text-center text-sm">
          No maintenance issues recorded.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Reported</TableHead>
            <TableHead>Vehicle</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Severity</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {issues.map((issue) => (
            <TableRow
              key={issue.id}
              className="cursor-pointer"
              onClick={() => router.push(`/maintenance/issues/${issue.id}`)}
            >
              <TableCell className="text-xs">{formatDate(issue.reported_at)}</TableCell>
              <TableCell>{issue.vehicle ? `Unit ${issue.vehicle.unit_number}` : "—"}</TableCell>
              <TableCell>{MAINTENANCE_ISSUE_TYPE_LABEL[issue.issue_type]}</TableCell>
              <TableCell className="font-medium">{issue.title}</TableCell>
              <TableCell>
                <Badge variant={issue.severity === "critical" ? "destructive" : "outline"} className="capitalize">
                  {MAINTENANCE_ISSUE_SEVERITY_LABEL[issue.severity]}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{MAINTENANCE_ISSUE_STATUS_LABEL[issue.status]}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
