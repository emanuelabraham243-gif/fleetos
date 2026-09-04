"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { voidFuelTransaction, type VoidFuelTransactionState } from "@/app/(app)/finance/fuel/actions";
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

/** Fuel transactions are never hard-deleted -- voiding keeps the row with a reason, excluded from totals by status. */
export function VoidFuelDialog({ transactionId }: { transactionId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<VoidFuelTransactionState, FormData>(
    voidFuelTransaction,
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
        <Button size="sm" variant="outline">
          Void
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Void Fuel Transaction</DialogTitle>
          <DialogDescription>
            This keeps the record on file, excluded from totals, with the reason attached -- it is
            never deleted.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="transaction_id" value={transactionId} />
          <div className="flex flex-col gap-2">
            <Label htmlFor="reason">Reason *</Label>
            <textarea
              id="reason"
              name="reason"
              rows={2}
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
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending ? "Voiding…" : "Void Transaction"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
