"use client";

import { useMemo, useState } from "react";
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
import type { WorkOrderListItem } from "@/lib/data/work-orders";
import { formatCurrency } from "@/lib/format-currency";
import { formatDate } from "@/lib/format-time";
import { WORK_ORDER_PRIORITY_LABEL, WORK_ORDER_STATUS_LABEL } from "@/lib/i18n/labels";

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="border-input bg-background h-9 rounded-md border px-2 text-sm shadow-xs"
    >
      <option value="">{label}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function WorkOrdersList({ workOrders }: { workOrders: WorkOrderListItem[] }) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = useMemo(
    () => (statusFilter ? workOrders.filter((wo) => wo.status === statusFilter) : workOrders),
    [workOrders, statusFilter],
  );

  const statusOptions = Object.keys(WORK_ORDER_STATUS_LABEL).map((s) => ({
    value: s,
    label: WORK_ORDER_STATUS_LABEL[s as keyof typeof WORK_ORDER_STATUS_LABEL],
  }));

  return (
    <div className="flex flex-col gap-4">
      <FilterSelect label="Status" value={statusFilter} onChange={setStatusFilter} options={statusOptions} />

      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="text-muted-foreground py-16 text-center text-sm">
            {workOrders.length === 0 ? "No work orders yet." : "No work orders match this filter."}
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Opened</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Assigned</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((wo) => (
                <TableRow key={wo.id} className="cursor-pointer" onClick={() => router.push(`/maintenance/work-orders/${wo.id}`)}>
                  <TableCell className="text-xs">{formatDate(wo.opened_at)}</TableCell>
                  <TableCell>{wo.vehicle ? `Unit ${wo.vehicle.unit_number}` : "—"}</TableCell>
                  <TableCell className="font-medium">{wo.title}</TableCell>
                  <TableCell>
                    <Badge variant={wo.priority === "CRITICAL" ? "destructive" : "outline"}>
                      {WORK_ORDER_PRIORITY_LABEL[wo.priority]}
                    </Badge>
                  </TableCell>
                  <TableCell>{wo.vendor?.name ?? wo.assigned_to_profile?.full_name ?? "Unassigned"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{WORK_ORDER_STATUS_LABEL[wo.status]}</Badge>
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
  );
}
