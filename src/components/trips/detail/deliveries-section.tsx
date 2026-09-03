import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DELIVERY_STATUS_BADGE_VARIANT } from "@/components/deliveries/deliveries-explorer";
import type { DeliveryListItem } from "@/lib/data/deliveries";
import { DELIVERY_STATUS_LABEL } from "@/lib/i18n/labels";

export function DeliveriesSection({ deliveries }: { deliveries: DeliveryListItem[] }) {
  if (deliveries.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="text-muted-foreground py-10 text-center text-sm">
          No deliveries recorded for this trip yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        {deliveries.map((delivery) => (
          <Link
            key={delivery.id}
            href={`/deliveries/${delivery.id}`}
            className="hover:bg-accent/50 flex items-center justify-between gap-4 rounded-md border p-3 text-sm"
          >
            <div>
              <p className="font-medium">{delivery.delivery_number ?? "Delivery"}</p>
              <p className="text-muted-foreground text-xs">
                {delivery.recipient_name ?? delivery.client?.name ?? "No recipient on record"}
              </p>
            </div>
            <Badge variant={DELIVERY_STATUS_BADGE_VARIANT[delivery.status]}>
              {DELIVERY_STATUS_LABEL[delivery.status]}
            </Badge>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
