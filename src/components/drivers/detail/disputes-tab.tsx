"use client";

import { useActionState, useState } from "react";

import { recordDriverResponse, type RecordDriverResponseState } from "@/lib/actions/disputes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { DriverDispute } from "@/lib/data/driver-disputes";
import { formatDateTime } from "@/lib/format-time";

const DISPUTE_TYPE_LABEL: Record<string, string> = {
  fuel_variance: "Fuel Variance",
  damage_claim: "Damage Claim",
  delivery_dispute: "Delivery Dispute",
  payment_dispute: "Payment Dispute",
  other: "Other",
};

const STATUS_VARIANT: Record<string, "outline" | "status-delayed" | "status-live" | "status-offline" | "secondary"> = {
  open: "status-delayed",
  under_review: "status-delayed",
  resolved: "status-live",
  rejected: "status-offline",
  withdrawn: "secondary",
};

const DISPUTE_STATUS_LABEL: Record<string, string> = {
  open: "Open",
  under_review: "Under Review",
  resolved: "Resolved",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

function DriverResponseForm({ disputeId }: { disputeId: string }) {
  const [showForm, setShowForm] = useState(false);
  const boundAction = recordDriverResponse.bind(null, disputeId);
  const [state, formAction, pending] = useActionState<RecordDriverResponseState, FormData>(
    boundAction,
    null,
  );

  if (!showForm) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(true)}>
        Add Driver Response
      </Button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <textarea
        name="driver_response"
        rows={2}
        required
        placeholder="The driver's own account of what happened…"
        className="border-input bg-background rounded-md border px-3 py-2 text-sm shadow-xs"
      />
      {state && "error" in state ? (
        <p role="alert" className="text-destructive text-xs">
          {state.error}
        </p>
      ) : null}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Save Response"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export function DriverDisputesTab({ disputes }: { disputes: DriverDispute[] }) {
  if (disputes.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="text-muted-foreground py-10 text-center text-sm">
          No disputes involve this driver.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        {disputes.map((dispute) => (
          <div key={dispute.id} className="flex flex-col gap-2 border-b pb-4 last:border-b-0 last:pb-0">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{DISPUTE_TYPE_LABEL[dispute.dispute_type] ?? dispute.dispute_type}</span>
              <Badge variant={STATUS_VARIANT[dispute.status] ?? "outline"}>
                {DISPUTE_STATUS_LABEL[dispute.status] ?? dispute.status}
              </Badge>
            </div>
            <p className="text-sm">{dispute.description}</p>
            <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs">
              <span>Opened {formatDateTime(dispute.opened_at)}</span>
              {dispute.trip ? <span>Trip: {dispute.trip.trip_number}</span> : null}
              {dispute.delivery ? <span>Delivery: {dispute.delivery.delivery_number}</span> : null}
              {dispute.vehicle ? <span>Unit {dispute.vehicle.unit_number}</span> : null}
              {dispute.client ? <span>Client: {dispute.client.name}</span> : null}
            </div>

            {dispute.driver_response ? (
              <div className="bg-muted/50 rounded-md p-2">
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Driver Response
                </p>
                <p className="mt-1 text-sm whitespace-pre-wrap">{dispute.driver_response}</p>
              </div>
            ) : null}

            {dispute.resolution ? (
              <div>
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Resolution
                </p>
                <p className="text-sm whitespace-pre-wrap">{dispute.resolution}</p>
              </div>
            ) : null}

            <DriverResponseForm disputeId={dispute.id} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
