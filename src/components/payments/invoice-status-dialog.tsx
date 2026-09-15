"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { sendInvoice, voidInvoice, type InvoiceActionState } from "@/app/(app)/finance/payments/actions";
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

/** DRAFT -> SENT or DRAFT/SENT -> VOID -- both explicit, confirmed actions, never a status picked from a free dropdown. */
export function InvoiceStatusDialog({
  invoiceId,
  invoiceNumber,
  action,
}: {
  invoiceId: string;
  invoiceNumber: string;
  action: "send" | "void";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<InvoiceActionState, FormData>(
    action === "send" ? sendInvoice : voidInvoice,
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
        <Button size="sm" variant={action === "send" ? "default" : "outline"}>
          {action === "send" ? "Send" : "Void"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{action === "send" ? "Send" : "Void"} Invoice -- {invoiceNumber}</DialogTitle>
          <DialogDescription>
            {action === "send"
              ? "This marks the invoice sent -- it now counts toward outstanding and overdue totals."
              : "This keeps the invoice on file, marked void with a reason -- it is never deleted."}
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="invoice_id" value={invoiceId} />
          {action === "void" ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="void_reason">Reason *</Label>
              <textarea
                id="void_reason"
                name="void_reason"
                rows={2}
                required
                className="border-input bg-background rounded-md border px-3 py-2 text-sm shadow-xs"
              />
            </div>
          ) : null}
          {state && "error" in state ? (
            <p role="alert" className="text-destructive text-sm">
              {state.error}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="submit" variant={action === "void" ? "destructive" : "default"} disabled={pending}>
              {pending ? "Saving…" : action === "send" ? "Send Invoice" : "Void Invoice"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
