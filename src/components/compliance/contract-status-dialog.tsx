"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { transitionContractStatus, type ContractStatusState } from "@/app/(app)/compliance/contracts/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { nextContractStatuses, type ContractStatus } from "@/lib/domain/contract";
import { CONTRACT_STATUS_LABEL } from "@/lib/i18n/labels";

export function ContractStatusDialog({ contractId, status }: { contractId: string; status: ContractStatus }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ContractStatusState, FormData>(
    transitionContractStatus,
    null,
  );
  const options = nextContractStatuses(status);

  useEffect(() => {
    if (state && "success" in state) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(false);
      router.refresh();
    }
  }, [state, router]);

  if (options.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Change Status
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Contract Status</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="contract_id" value={contractId} />
          <div className="flex flex-col gap-2">
            <Label htmlFor="to_status">New status *</Label>
            <select
              id="to_status"
              name="to_status"
              required
              defaultValue=""
              className="border-input bg-background h-9 rounded-md border px-2 text-sm shadow-xs"
            >
              <option value="" disabled>
                Select a status
              </option>
              {options.map((s) => (
                <option key={s} value={s}>
                  {CONTRACT_STATUS_LABEL[s]}
                </option>
              ))}
            </select>
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
