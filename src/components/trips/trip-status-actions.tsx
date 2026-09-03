"use client";

import { useActionState, useState } from "react";

import { transitionTripStatus, type TransitionTripState } from "@/app/(app)/trips/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { nextTripStatuses } from "@/lib/domain/trip";
import type { TripStatus } from "@/lib/domain/trip";
import { TRIP_STATUS_LABEL } from "@/lib/i18n/labels";

/**
 * The one place trip status action buttons render, shared by the Dispatch
 * board and Trip Detail so both read the same allowed-transitions list
 * (`nextTripStatuses`) and post through the same server action -- a trip
 * can never be moved to a status that isn't a legal next step from here.
 */
export function TripStatusActions({
  tripId,
  status,
  size = "default",
}: {
  tripId: string;
  status: TripStatus;
  size?: "default" | "sm";
}) {
  const [state, formAction, pending] = useActionState<TransitionTripState, FormData>(
    transitionTripStatus,
    null,
  );
  const [cancelling, setCancelling] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");

  const forwardStatuses = nextTripStatuses(status).filter((s) => s !== "CANCELLED");
  const canCancel = nextTripStatuses(status).includes("CANCELLED");

  if (forwardStatuses.length === 0 && !canCancel) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {forwardStatuses.map((next) => (
          <form key={next} action={formAction}>
            <input type="hidden" name="trip_id" value={tripId} />
            <input type="hidden" name="to_status" value={next} />
            <Button type="submit" size={size} disabled={pending}>
              Mark {TRIP_STATUS_LABEL[next]}
            </Button>
          </form>
        ))}
        {canCancel && !cancelling ? (
          <Button
            type="button"
            variant="outline"
            size={size}
            disabled={pending}
            onClick={() => setCancelling(true)}
          >
            Cancel Trip
          </Button>
        ) : null}
      </div>

      {cancelling ? (
        <form action={formAction} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="trip_id" value={tripId} />
          <input type="hidden" name="to_status" value="CANCELLED" />
          <Input
            name="cancellation_reason"
            value={cancellationReason}
            onChange={(e) => setCancellationReason(e.target.value)}
            placeholder="Reason for cancellation"
            required
            className="h-8 max-w-xs text-sm"
          />
          <Button type="submit" variant="destructive" size={size} disabled={pending}>
            Confirm Cancellation
          </Button>
          <Button type="button" variant="ghost" size={size} onClick={() => setCancelling(false)}>
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
