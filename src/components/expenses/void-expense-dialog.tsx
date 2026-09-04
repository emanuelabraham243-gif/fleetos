"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { voidExpense, type VoidExpenseState } from "@/app/(app)/finance/expenses/actions";
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

/** Expenses are never hard-deleted -- voiding keeps the row with a reason, excluded from totals by status. */
export function VoidExpenseDialog({ expenseId }: { expenseId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<VoidExpenseState, FormData>(voidExpense, null);

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
          <DialogTitle>Void Expense</DialogTitle>
          <DialogDescription>
            This keeps the record on file, excluded from totals, with the reason attached -- it is
            never deleted.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="expense_id" value={expenseId} />
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
          {state && "error" in state ? (
            <p role="alert" className="text-destructive text-sm">
              {state.error}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending ? "Voiding…" : "Void Expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
