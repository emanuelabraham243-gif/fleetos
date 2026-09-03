"use client";

import { ChevronRight, Package, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DeliveryListItem, DeliverySummary } from "@/lib/data/deliveries";
import { formatDateTime } from "@/lib/format-time";
import { DELIVERY_STATUS_LABEL } from "@/lib/i18n/labels";
import type { DeliveryStatus } from "@/lib/domain/delivery";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: DeliveryStatus[] = [
  "PENDING",
  "IN_TRANSIT",
  "ARRIVED",
  "DELIVERED",
  "PARTIALLY_DELIVERED",
  "REFUSED",
  "DAMAGED",
  "CANCELLED",
];

export const DELIVERY_STATUS_BADGE_VARIANT: Record<
  DeliveryStatus,
  "status-live" | "outline" | "status-delayed" | "status-offline" | "secondary"
> = {
  PENDING: "secondary",
  IN_TRANSIT: "status-live",
  ARRIVED: "status-delayed",
  DELIVERED: "outline",
  PARTIALLY_DELIVERED: "status-delayed",
  REFUSED: "status-offline",
  DAMAGED: "status-offline",
  CANCELLED: "secondary",
};

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

export function DeliveriesExplorer({
  deliveries,
  summary,
}: {
  deliveries: DeliveryListItem[];
  summary: DeliverySummary;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return deliveries.filter((delivery) => {
      if (statusFilter && delivery.status !== statusFilter) return false;
      if (query) {
        const haystack = [
          delivery.delivery_number,
          delivery.reference_number,
          delivery.recipient_name,
          delivery.client?.name,
          delivery.trip?.trip_number,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [deliveries, search, statusFilter]);

  function toggleStatusFilter(status: DeliveryStatus | null) {
    setStatusFilter((current) => (status === null ? "" : current === status ? "" : status));
  }

  const summaryCards: { label: string; value: number; status: DeliveryStatus | null }[] = [
    { label: "Total Deliveries", value: summary.total, status: null },
    { label: "Pending", value: summary.pending, status: "PENDING" },
    { label: "In Transit", value: summary.inTransit, status: "IN_TRANSIT" },
    { label: "Delivered", value: summary.delivered, status: "DELIVERED" },
    { label: "Exceptions", value: summary.exceptions, status: null },
  ];

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {summaryCards.map((card) => (
          <button
            key={card.label}
            type="button"
            onClick={() => toggleStatusFilter(card.status)}
            className={cn(
              "text-left transition-colors",
              card.status !== null && statusFilter === card.status && "ring-primary ring-2",
            )}
          >
            <Card className="hover:bg-accent/50 cursor-pointer">
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

      <div className="flex flex-col gap-3">
        <div className="relative max-w-sm">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search delivery #, reference, recipient, client, trip…"
            className="pl-8"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterSelect
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={STATUS_OPTIONS.map((s) => ({ value: s, label: DELIVERY_STATUS_LABEL[s] }))}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Package className="text-muted-foreground size-8" />
            <p className="text-muted-foreground max-w-sm text-sm">
              {deliveries.length === 0
                ? "No deliveries yet. Deliveries appear here once a trip has stops with cargo to drop off."
                : "No deliveries match these filters."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Delivery #</TableHead>
                  <TableHead>Trip</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead className="w-8" aria-label="Actions" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((delivery) => (
                  <TableRow
                    key={delivery.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/deliveries/${delivery.id}`)}
                  >
                    <TableCell className="font-medium">{delivery.delivery_number ?? "—"}</TableCell>
                    <TableCell>{delivery.trip?.trip_number ?? "—"}</TableCell>
                    <TableCell>{delivery.recipient_name ?? "—"}</TableCell>
                    <TableCell>{delivery.client?.name ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={DELIVERY_STATUS_BADGE_VARIANT[delivery.status]}>
                        {DELIVERY_STATUS_LABEL[delivery.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {delivery.scheduled_at ? formatDateTime(delivery.scheduled_at) : "—"}
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="text-muted-foreground size-4" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:hidden">
            {filtered.map((delivery) => (
              <Card
                key={delivery.id}
                className="hover:bg-accent/50 cursor-pointer"
                onClick={() => router.push(`/deliveries/${delivery.id}`)}
              >
                <CardContent className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{delivery.delivery_number ?? "Delivery"}</p>
                      <p className="text-muted-foreground text-xs">{delivery.trip?.trip_number ?? "—"}</p>
                    </div>
                    <Badge variant={DELIVERY_STATUS_BADGE_VARIANT[delivery.status]}>
                      {DELIVERY_STATUS_LABEL[delivery.status]}
                    </Badge>
                  </div>
                  <div className="text-muted-foreground grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                    <span>Recipient</span>
                    <span className="text-foreground text-right">{delivery.recipient_name ?? "—"}</span>
                    <span>Scheduled</span>
                    <span className="text-foreground text-right">
                      {delivery.scheduled_at ? formatDateTime(delivery.scheduled_at) : "—"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
