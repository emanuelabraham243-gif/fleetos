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
import type { InspectionListItem } from "@/lib/data/inspections";
import { formatDate } from "@/lib/format-time";
import { INSPECTION_OVERALL_RESULT_LABEL, INSPECTION_TYPE_LABEL } from "@/lib/i18n/labels";

const RESULT_BADGE_VARIANT: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
  PASSED: "default",
  FAILED: "destructive",
  PARTIAL: "secondary",
  UNKNOWN: "outline",
};

export function InspectionsList({
  inspections,
  issuesCreatedByInspection,
}: {
  inspections: InspectionListItem[];
  issuesCreatedByInspection: Record<string, number>;
}) {
  const router = useRouter();

  if (inspections.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="text-muted-foreground py-16 text-center text-sm">
          No inspection records.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Vehicle</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Driver</TableHead>
            <TableHead>Inspector</TableHead>
            <TableHead>Result</TableHead>
            <TableHead>Mileage</TableHead>
            <TableHead>Issues Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {inspections.map((inspection) => (
            <TableRow
              key={inspection.id}
              className="cursor-pointer"
              onClick={() => router.push(`/inspections/${inspection.id}`)}
            >
              <TableCell className="text-xs">{formatDate(inspection.performed_at)}</TableCell>
              <TableCell>{inspection.vehicle ? `Unit ${inspection.vehicle.unit_number}` : "—"}</TableCell>
              <TableCell>{INSPECTION_TYPE_LABEL[inspection.inspection_type]}</TableCell>
              <TableCell>{inspection.driver?.full_name ?? "—"}</TableCell>
              <TableCell>{inspection.inspector?.full_name ?? "—"}</TableCell>
              <TableCell>
                <Badge variant={RESULT_BADGE_VARIANT[inspection.overall_result]}>
                  {INSPECTION_OVERALL_RESULT_LABEL[inspection.overall_result]}
                </Badge>
              </TableCell>
              <TableCell>
                {inspection.odometer_km !== null ? `${Number(inspection.odometer_km).toLocaleString()} km` : "—"}
              </TableCell>
              <TableCell>{issuesCreatedByInspection[inspection.id] ?? 0}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
