import { Card, CardContent } from "@/components/ui/card";
import type { DeliveryDetail } from "@/lib/data/deliveries";
import { formatDateTime } from "@/lib/format-time";
import { isExceptionDeliveryStatus } from "@/lib/domain/delivery";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b py-2 text-sm last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

export function DeliveryOverview({ delivery }: { delivery: DeliveryDetail }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardContent className="flex flex-col">
          <h3 className="mb-2 text-sm font-semibold">Delivery</h3>
          <InfoRow label="Trip" value={delivery.trip?.trip_number ?? "—"} />
          <InfoRow label="Vehicle" value={delivery.trip?.vehicle ? `Unit ${delivery.trip.vehicle.unit_number}` : "—"} />
          <InfoRow label="Driver" value={delivery.trip?.driver?.full_name ?? "—"} />
          <InfoRow label="Stop location" value={delivery.trip_stop?.location ?? "—"} />
          <InfoRow label="Reference number" value={delivery.reference_number ?? "—"} />
          <InfoRow
            label="Scheduled"
            value={delivery.scheduled_at ? formatDateTime(delivery.scheduled_at) : "—"}
          />
          <InfoRow
            label="Arrived"
            value={delivery.arrived_at ? formatDateTime(delivery.arrived_at) : "Not yet arrived"}
          />
          <InfoRow
            label="Delivered"
            value={delivery.delivered_at ? formatDateTime(delivery.delivered_at) : "Not yet confirmed"}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col">
          <h3 className="mb-2 text-sm font-semibold">Recipient & Client</h3>
          <InfoRow label="Recipient" value={delivery.recipient_name ?? "—"} />
          <InfoRow label="Client" value={delivery.client?.name ?? "No client on record"} />
          <InfoRow label="Description" value={delivery.description ?? "—"} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col">
          <h3 className="mb-2 text-sm font-semibold">Quantity</h3>
          <InfoRow
            label="Expected"
            value={
              delivery.expected_quantity !== null
                ? `${delivery.expected_quantity}${delivery.quantity_unit ? ` ${delivery.quantity_unit}` : ""}`
                : "—"
            }
          />
          <InfoRow
            label="Delivered"
            value={
              delivery.delivered_quantity !== null
                ? `${delivery.delivered_quantity}${delivery.quantity_unit ? ` ${delivery.quantity_unit}` : ""}`
                : "Not yet confirmed"
            }
          />
        </CardContent>
      </Card>

      {isExceptionDeliveryStatus(delivery.status) ? (
        <Card>
          <CardContent className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold">Exception Details</h3>
            {delivery.refusal_reason ? (
              <div>
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Refusal reason
                </p>
                <p className="text-sm whitespace-pre-wrap">{delivery.refusal_reason}</p>
              </div>
            ) : null}
            {delivery.notes ? (
              <div>
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Notes</p>
                <p className="text-sm whitespace-pre-wrap">{delivery.notes}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold">Notes</h3>
            <p className="text-sm whitespace-pre-wrap">{delivery.notes ?? "—"}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
