import Link from "next/link";

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
import { DELIVERY_STATUS_BADGE_VARIANT } from "@/components/deliveries/deliveries-explorer";
import type { DeliveryListItem } from "@/lib/data/deliveries";
import { formatDate } from "@/lib/format-time";
import { DELIVERY_STATUS_LABEL } from "@/lib/i18n/labels";

export function DriverDeliveriesTab({ deliveries }: { deliveries: DeliveryListItem[] }) {
  if (deliveries.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="text-muted-foreground py-10 text-center text-sm">
          No deliveries recorded for this driver yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Delivery</TableHead>
            <TableHead>Trip</TableHead>
            <TableHead>Vehicle</TableHead>
            <TableHead>Destination</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Confirmation</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deliveries.map((delivery) => (
            <TableRow key={delivery.id}>
              <TableCell className="font-medium">
                <Link href={`/deliveries/${delivery.id}`} className="hover:underline">
                  {delivery.delivery_number ?? "Delivery"}
                </Link>
              </TableCell>
              <TableCell>
                {delivery.trip ? (
                  <Link href={`/trips/${delivery.trip.id}`} className="hover:underline">
                    {delivery.trip.trip_number}
                  </Link>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell>
                {delivery.trip?.vehicle ? `Unit ${delivery.trip.vehicle.unit_number}` : "—"}
              </TableCell>
              <TableCell>{delivery.recipient_name ?? delivery.trip_stop?.location ?? "—"}</TableCell>
              <TableCell>
                <Badge variant={DELIVERY_STATUS_BADGE_VARIANT[delivery.status]}>
                  {DELIVERY_STATUS_LABEL[delivery.status]}
                </Badge>
              </TableCell>
              <TableCell className="text-xs">
                {delivery.scheduled_at ? formatDate(delivery.scheduled_at) : "—"}
              </TableCell>
              <TableCell className="text-xs">
                {delivery.delivered_at ? formatDate(delivery.delivered_at) : "Not yet confirmed"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
