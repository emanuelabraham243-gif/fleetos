"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { recordPayment, type RecordPaymentState } from "@/app/(app)/finance/payments/actions";
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
import { formatCurrency } from "@/lib/format-currency";
import { PAYMENT_METHOD_LABEL } from "@/lib/i18n/labels";
import type { Database } from "@/lib/supabase/database.types";

const PAYMENT_METHODS = Object.keys(PAYMENT_METHOD_LABEL) as Database["public"]["Enums"]["payment_method"][];

export function RecordPaymentDialog({
  invoiceId,
  invoiceNumber,
  balance,
  currency,
}: {
  invoiceId: string;
  invoiceNumber: string;
  balance: number;
  currency: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<RecordPaymentState, FormData>(recordPayment, null);

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
        <Button size="sm">Record Payment</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Payment -- {invoiceNumber}</DialogTitle>
          <DialogDescription>Outstanding balance: {formatCurrency(balance, currency)}</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="invoice_id" value={invoiceId} />
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                min={0.01}
                step="0.01"
                required
                defaultValue={balance > 0 ? balance : undefined}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="paid_at">Date *</Label>
              <Input id="paid_at" name="paid_at" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="method">Method *</Label>
              <select
                id="method"
                name="method"
                required
                defaultValue="bank_transfer"
                className="border-input bg-background h-9 rounded-md border px-2 text-sm shadow-xs"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {PAYMENT_METHOD_LABEL[m]}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="reference">Reference</Label>
              <Input id="reference" name="reference" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              name="notes"
              rows={2}
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
              {pending ? "Saving…" : "Record Payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
