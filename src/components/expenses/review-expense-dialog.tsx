"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { reviewExpense, type ReviewExpenseState } from "@/app/(app)/finance/expenses/actions";
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

/** The RECORDED/PENDING_REVIEW -> APPROVED/REJECTED step -- a human decision, never inferred from who entered the expense. */
export function ReviewExpenseDialog({ expenseId, decision }: { expenseId: string; decision: "APPROVED" | "REJECTED" }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ReviewExpenseState, FormData>(reviewExpense, null);

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
        <Button size="sm" variant={decision === "APPROVED" ? "default" : "outline"}>
          {decision === "APPROVED" ? "Approve" : "Reject"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{decision === "APPROVED" ? "Approve Expense" : "Reject Expense"}</DialogTitle>
          <DialogDescription>
            {decision === "APPROVED"
              ? "This marks the expense reviewed and accepted."
              : "The expense stays on file, marked rejected with a reason -- it is never deleted."}
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="expense_id" value={expenseId} />
          <input type="hidden" name="decision" value={decision} />
          {decision === "REJECTED" ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="rejection_reason">Reason *</Label>
              <textarea
                id="rejection_reason"
                name="rejection_reason"
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
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : decision === "APPROVED" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
