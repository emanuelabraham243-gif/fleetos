"use client";

import { AlertTriangle } from "lucide-react";
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
import type { DisputeListItem } from "@/lib/data/disputes";
import { formatDate } from "@/lib/format-time";
import { DISPUTE_STATUS_LABEL, DISPUTE_TYPE_LABEL } from "@/lib/i18n/labels";
import type { Database } from "@/lib/supabase/database.types";

type DisputeStatus = Database["public"]["Enums"]["dispute_status"];

const STATUS_BADGE_VARIANT: Record<DisputeStatus, "default" | "secondary" | "destructive" | "outline"> = {
  open: "destructive",
  under_review: "secondary",
  resolved: "default",
  rejected: "outline",
  withdrawn: "outline",
};

export function DisputesList({ disputes }: { disputes: DisputeListItem[] }) {
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = useMemo(
    () => disputes.filter((d) => !statusFilter || d.status === statusFilter),
    [disputes, statusFilter],
  );

  return (
    <div className="flex flex-col gap-4">
      <select
        aria-label="Status"
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="border-input bg-background h-9 w-fit rounded-md border px-2 text-sm shadow-xs"
      >
        <option value="">All statuses</option>
        {(Object.keys(DISPUTE_STATUS_LABEL) as DisputeStatus[]).map((s) => (
          <option key={s} value={s}>
            {DISPUTE_STATUS_LABEL[s]}
          </option>
        ))}
      </select>

      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <AlertTriangle className="text-muted-foreground size-8" />
            <p className="text-muted-foreground max-w-sm text-sm">
              {disputes.length === 0 ? "No disputes raised." : "No disputes match this filter."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Opened</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Trip</TableHead>
                <TableHead>Delivery</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="text-xs">
                    <Link href={`/issues/disputes/${d.id}`} className="hover:underline">
                      {formatDate(d.opened_at)}
                    </Link>
                  </TableCell>
                  <TableCell>{DISPUTE_TYPE_LABEL[d.dispute_type]}</TableCell>
                  <TableCell>{d.client?.name ?? "—"}</TableCell>
                  <TableCell>{d.trip?.trip_number ?? "—"}</TableCell>
                  <TableCell>{d.delivery?.delivery_number ?? "—"}</TableCell>
                  <TableCell>{d.driver?.full_name ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_BADGE_VARIANT[d.status]}>{DISPUTE_STATUS_LABEL[d.status]}</Badge>
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
