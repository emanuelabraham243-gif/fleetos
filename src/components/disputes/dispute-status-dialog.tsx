"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { transitionDisputeStatus, type TransitionDisputeState } from "@/lib/actions/disputes";
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
import { nextDisputeStatuses, type DisputeStatus } from "@/lib/domain/dispute";
import { DISPUTE_STATUS_LABEL } from "@/lib/i18n/labels";

export function DisputeStatusDialog({ disputeId, status }: { disputeId: string; status: DisputeStatus }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [toStatus, setToStatus] = useState("");
  const [state, formAction, pending] = useActionState<TransitionDisputeState, FormData>(
    transitionDisputeStatus,
    null,
  );
  const options = nextDisputeStatuses(status);
  const needsResolution = toStatus === "resolved" || toStatus === "rejected";

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
          <DialogTitle>Change Dispute Status</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="dispute_id" value={disputeId} />
          <div className="flex flex-col gap-2">
            <Label htmlFor="to_status">New status *</Label>
            <select
              id="to_status"
              name="to_status"
              required
              value={toStatus}
              onChange={(e) => setToStatus(e.target.value)}
              className="border-input bg-background h-9 rounded-md border px-2 text-sm shadow-xs"
            >
              <option value="" disabled>
                Select a status
              </option>
              {options.map((s) => (
                <option key={s} value={s}>
                  {DISPUTE_STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </div>
          {toStatus ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="resolution">Resolution {needsResolution ? "*" : ""}</Label>
              <textarea
                id="resolution"
                name="resolution"
                rows={3}
                required={needsResolution}
                placeholder={needsResolution ? "What was decided and why." : "Optional note."}
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
              {pending ? "Saving…" : "Confirm"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
