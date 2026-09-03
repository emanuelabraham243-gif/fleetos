"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { createDispute, type CreateDisputeState } from "@/lib/actions/disputes";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const DISPUTE_TYPES: { value: string; label: string }[] = [
  { value: "delivery_dispute", label: "Delivery dispute" },
  { value: "damage_claim", label: "Damage claim" },
  { value: "fuel_variance", label: "Fuel variance" },
  { value: "payment_dispute", label: "Payment dispute" },
  { value: "other", label: "Other" },
];

export function RaiseDisputeDialog({
  tripId = null,
  deliveryId = null,
  vehicleId = null,
}: {
  tripId?: string | null;
  deliveryId?: string | null;
  vehicleId?: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const boundAction = createDispute.bind(null, { tripId, deliveryId, vehicleId });
  const [state, formAction, pending] = useActionState<CreateDisputeState, FormData>(
    boundAction,
    null,
  );

  useEffect(() => {
    if (state && "success" in state) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(false);
      router.refresh();
    }
  }, [state, router]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Raise Dispute
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Raise Dispute</DialogTitle>
          <DialogDescription>
            Records a dispute against this record for review -- it does not change the trip or
            delivery&apos;s own status.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="dispute_type">Type</Label>
            <select
              id="dispute_type"
              name="dispute_type"
              defaultValue=""
              required
              className="border-input bg-background h-9 rounded-md border px-2 text-sm shadow-xs"
            >
              <option value="" disabled>
                Select a type
              </option>
              {DISPUTE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              name="description"
              rows={3}
              required
              className="border-input bg-background rounded-md border px-3 py-2 text-sm shadow-xs"
            />
          </div>
          {state && "error" in state ? (
            <p role="alert" className="text-destructive text-sm">
              {state.error}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Submitting…" : "Raise Dispute"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
