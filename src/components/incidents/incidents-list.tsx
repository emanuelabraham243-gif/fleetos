"use client";

import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

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
import type { IncidentListItem } from "@/lib/data/incidents";
import { formatFullDateTime } from "@/lib/format-time";
import { INCIDENT_SEVERITY_LABEL, INCIDENT_STATUS_LABEL, INCIDENT_TYPE_LABEL } from "@/lib/i18n/labels";
import type { Database } from "@/lib/supabase/database.types";

type IncidentStatus = Database["public"]["Enums"]["incident_status"];
type IncidentSeverity = Database["public"]["Enums"]["incident_severity"];

const STATUS_BADGE_VARIANT: Record<IncidentStatus, "default" | "secondary" | "destructive" | "outline"> = {
  open: "destructive",
  investigating: "secondary",
  resolved: "default",
  closed: "outline",
};

const SEVERITY_BADGE_VARIANT: Record<IncidentSeverity, "default" | "secondary" | "destructive" | "outline"> = {
  low: "outline",
  medium: "secondary",
  high: "destructive",
  critical: "destructive",
};

export function IncidentsList({ incidents }: { incidents: IncidentListItem[] }) {
  const [statusFilter, setStatusFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");

  const filtered = useMemo(
    () =>
      incidents.filter((i) => {
        if (statusFilter && i.status !== statusFilter) return false;
        if (severityFilter && i.severity !== severityFilter) return false;
        return true;
      }),
    [incidents, statusFilter, severityFilter],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <select
          aria-label="Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border-input bg-background h-9 rounded-md border px-2 text-sm shadow-xs"
        >
          <option value="">All statuses</option>
          {(Object.keys(INCIDENT_STATUS_LABEL) as IncidentStatus[]).map((s) => (
            <option key={s} value={s}>
              {INCIDENT_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <select
          aria-label="Severity"
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="border-input bg-background h-9 rounded-md border px-2 text-sm shadow-xs"
        >
          <option value="">All severities</option>
          {(Object.keys(INCIDENT_SEVERITY_LABEL) as IncidentSeverity[]).map((s) => (
            <option key={s} value={s}>
              {INCIDENT_SEVERITY_LABEL[s]}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <ShieldAlert className="text-muted-foreground size-8" />
            <p className="text-muted-foreground max-w-sm text-sm">
              {incidents.length === 0 ? "No incidents recorded." : "No incidents match these filters."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Occurred</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Trip</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((incident) => (
                <TableRow key={incident.id}>
                  <TableCell className="text-xs">
                    <Link href={`/issues/incidents/${incident.id}`} className="hover:underline">
                      {formatFullDateTime(incident.occurred_at)}
                    </Link>
                  </TableCell>
                  <TableCell>{INCIDENT_TYPE_LABEL[incident.incident_type]}</TableCell>
                  <TableCell>{incident.vehicle ? `Unit ${incident.vehicle.unit_number}` : "—"}</TableCell>
                  <TableCell>{incident.driver?.full_name ?? "—"}</TableCell>
                  <TableCell>{incident.trip?.trip_number ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={SEVERITY_BADGE_VARIANT[incident.severity]}>
                      {INCIDENT_SEVERITY_LABEL[incident.severity]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_BADGE_VARIANT[incident.status]}>
                      {INCIDENT_STATUS_LABEL[incident.status]}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
