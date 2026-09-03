"use client";

import { useActionState, useState } from "react";

import { transitionDeliveryStatus, type TransitionDeliveryState } from "@/app/(app)/deliveries/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { nextDeliveryStatuses } from "@/lib/domain/delivery";
import type { DeliveryStatus } from "@/lib/domain/delivery";
import { DELIVERY_STATUS_LABEL } from "@/lib/i18n/labels";

/**
 * The simple forward moves (PENDING -> IN_TRANSIT -> ARRIVED) plus explicit
 * cancellation. Once a delivery reaches ARRIVED, `DeliveryConfirmationDialog`
 * takes over for the richer outcome step -- this component only ever
 * offers a single non-outcome next status, so it hides itself at ARRIVED.
 */
export function DeliveryStatusActions({
  deliveryId,
  status,
}: {
  deliveryId: string;
  status: DeliveryStatus;
}) {
  const [state, formAction, pending] = useActionState<TransitionDeliveryState, FormData>(
    transitionDeliveryStatus,
    null,
  );
  const [cancelling, setCancelling] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");

  const next = nextDeliveryStatuses(status);
  const simpleForward = next.filter((s) => s === "IN_TRANSIT" || s === "ARRIVED");
  const canCancel = next.includes("CANCELLED");

  if (simpleForward.length === 0 && !canCancel) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {simpleForward.map((s) => (
          <form key={s} action={formAction}>
            <input type="hidden" name="delivery_id" value={deliveryId} />
            <input type="hidden" name="to_status" value={s} />
            <Button type="submit" size="sm" disabled={pending}>
              Mark {DELIVERY_STATUS_LABEL[s]}
            </Button>
          </form>
        ))}
        {canCancel && !cancelling ? (
          <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => setCancelling(true)}>
            Cancel Delivery
          </Button>
        ) : null}
      </div>

      {cancelling ? (
        <form action={formAction} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="delivery_id" value={deliveryId} />
          <input type="hidden" name="to_status" value="CANCELLED" />
          <Input
            name="cancellation_reason"
            value={cancellationReason}
            onChange={(e) => setCancellationReason(e.target.value)}
            placeholder="Reason for cancellation"
            required
            className="h-8 max-w-xs text-sm"
          />
          <Button type="submit" variant="destructive" size="sm" disabled={pending}>
            Confirm Cancellation
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setCancelling(false)}>
            Back
          </Button>
        </form>
      ) : null}

      {state?.error ? (
        <p role="alert" className="text-destructive text-xs">
          {state.error}
        </p>
      ) : null}
    </div>
  );
}
