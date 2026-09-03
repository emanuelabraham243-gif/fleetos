"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { confirmDelivery, type ConfirmDeliveryState } from "@/app/(app)/deliveries/actions";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DeliveryStatus } from "@/lib/domain/delivery";

const OUTCOMES: { value: DeliveryStatus; label: string }[] = [
  { value: "DELIVERED", label: "Delivered in full" },
  { value: "PARTIALLY_DELIVERED", label: "Partially delivered" },
  { value: "REFUSED", label: "Refused by recipient" },
  { value: "DAMAGED", label: "Damaged" },
];

/**
 * The ARRIVED -> outcome step. Delivered-in-full still lets a dispatcher
 * override the quantity (a partial acceptance can look like a full arrival
 * until the recipient counts it), and every exception outcome requires the
 * fact that makes it an exception (a reason, a delivered quantity, a damage
 * note) rather than just flipping a status label.
 */
export function DeliveryConfirmationDialog({
  deliveryId,
  expectedQuantity,
  quantityUnit,
}: {
  deliveryId: string;
  expectedQuantity: number | null;
  quantityUnit: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [outcome, setOutcome] = useState<DeliveryStatus>("DELIVERED");
  const [state, formAction, pending] = useActionState<ConfirmDeliveryState, FormData>(
    confirmDelivery,
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
        <Button size="sm">Confirm Delivery</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Delivery</DialogTitle>
          <DialogDescription>
            Record what actually happened at delivery -- expected and delivered quantity are kept
            separately, and this never assigns fault to the driver.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="delivery_id" value={deliveryId} />
          <div className="flex flex-col gap-2">
            <Label htmlFor="outcome">Outcome</Label>
            <select
              id="outcome"
              name="outcome"
              value={outcome}
              onChange={(e) => setOutcome(e.target.value as DeliveryStatus)}
              className="border-input bg-background h-9 rounded-md border px-2 text-sm shadow-xs"
            >
              {OUTCOMES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {outcome === "DELIVERED" || outcome === "PARTIALLY_DELIVERED" ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="delivered_quantity">
                Delivered quantity{outcome === "PARTIALLY_DELIVERED" ? " *" : ""}
                {expectedQuantity !== null ? ` (expected ${expectedQuantity}${quantityUnit ? ` ${quantityUnit}` : ""})` : ""}
              </Label>
              <Input
                id="delivered_quantity"
                name="delivered_quantity"
                type="number"
                min={0}
                step="0.01"
                defaultValue={outcome === "DELIVERED" ? (expectedQuantity ?? "") : ""}
                required={outcome === "PARTIALLY_DELIVERED"}
              />
            </div>
          ) : null}

          {outcome === "REFUSED" ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="refusal_reason">Reason for refusal *</Label>
              <textarea
                id="refusal_reason"
                name="refusal_reason"
                rows={2}
                required
                placeholder="What the recipient said or did, as observed -- not an interpretation of why."
                className="border-input bg-background rounded-md border px-3 py-2 text-sm shadow-xs"
              />
            </div>
          ) : null}

          {outcome === "DAMAGED" ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="damage_note">Damage description *</Label>
              <textarea
                id="damage_note"
                name="damage_note"
                rows={2}
                required
                placeholder="What was observed damaged, and how much."
                className="border-input bg-background rounded-md border px-3 py-2 text-sm shadow-xs"
              />
            </div>
          ) : null}

          <div className="flex flex-col gap-2">
            <Label htmlFor="evidence">Photo evidence (optional)</Label>
            <input
              id="evidence"
              name="evidence"
              type="file"
              accept="image/*,application/pdf"
              className="text-sm"
            />
          </div>

          {state && "error" in state ? (
            <p role="alert" className="text-destructive text-sm">
              {state.error}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Confirm"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
