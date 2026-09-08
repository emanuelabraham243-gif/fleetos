"use client";

import { Pencil } from "lucide-react";
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
import type { ScheduleWithDue } from "@/lib/data/maintenance";
import { formatDueText } from "@/lib/days-until";
import { formatDate } from "@/lib/format-time";

const RULE_TYPE_LABEL: Record<string, string> = {
  TIME: "Time-based",
  MILEAGE: "Mileage-based",
  TIME_AND_MILEAGE: "Time or mileage",
};

export function SchedulesList({ schedules }: { schedules: ScheduleWithDue[] }) {
  const router = useRouter();

  if (schedules.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="text-muted-foreground py-16 text-center text-sm">
          No maintenance schedules yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Vehicle</TableHead>
            <TableHead>Service Type</TableHead>
            <TableHead>Rule</TableHead>
            <TableHead>Last Service</TableHead>
            <TableHead>Next Due</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-8" aria-label="Actions" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {schedules.map(({ schedule, vehicle, ruleType, due }) => (
            <TableRow key={schedule.id}>
              <TableCell className="font-medium">Unit {vehicle.unit_number}</TableCell>
              <TableCell>{schedule.title}</TableCell>
              <TableCell className="text-xs">
                {ruleType ? RULE_TYPE_LABEL[ruleType] : "Not configured"}
                <div className="text-muted-foreground">
                  {[
                    schedule.interval_km !== null ? `${Number(schedule.interval_km).toLocaleString()} km` : null,
                    schedule.interval_days !== null ? `${schedule.interval_days} days` : null,
                  ]
                    .filter(Boolean)
                    .join(" or ")}
                </div>
              </TableCell>
              <TableCell className="text-xs">
                {schedule.last_done_at ? formatDate(schedule.last_done_at) : "—"}
                {schedule.last_done_odometer_km !== null
                  ? ` · ${Number(schedule.last_done_odometer_km).toLocaleString()} km`
                  : ""}
              </TableCell>
              <TableCell className="text-xs">
                {due.remainingDays !== null ? formatDueText(due.remainingDays, "Due") : null}
                {due.remainingKm !== null
                  ? `${due.remainingDays !== null ? " · " : ""}${due.remainingKm >= 0 ? `${due.remainingKm.toLocaleString()} km remaining` : `${Math.abs(due.remainingKm).toLocaleString()} km overdue`}`
                  : null}
                {due.mileageStatus === "UNKNOWN" ? (
                  <div className="text-muted-foreground">Mileage status: UNKNOWN</div>
                ) : null}
              </TableCell>
              <TableCell>
                <Badge variant={due.status === "OVERDUE" ? "destructive" : "outline"}>
                  {due.status ?? "Not configured"}
                </Badge>
              </TableCell>
              <TableCell>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => router.push(`/maintenance/schedules/${schedule.id}/edit`)}
                  aria-label="Edit schedule"
                >
                  <Pencil className="size-4" />
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
