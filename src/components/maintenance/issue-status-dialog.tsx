"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { transitionMaintenanceIssue, type TransitionIssueState } from "@/app/(app)/maintenance/issues/actions";
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
import { MAINTENANCE_ISSUE_STATUS_LABEL } from "@/lib/i18n/labels";
import type { MaintenanceIssueStatus } from "@/lib/domain/maintenance-issue";

export function IssueStatusDialog({ issueId, toStatus }: { issueId: string; toStatus: MaintenanceIssueStatus }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<TransitionIssueState, FormData>(
    transitionMaintenanceIssue,
    null,
  );
  const requiresReason = toStatus === "DISMISSED";

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
        <Button size="sm" variant={requiresReason ? "outline" : "default"}>
          {MAINTENANCE_ISSUE_STATUS_LABEL[toStatus]}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move to {MAINTENANCE_ISSUE_STATUS_LABEL[toStatus]}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="issue_id" value={issueId} />
          <input type="hidden" name="to_status" value={toStatus} />
          {requiresReason ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="dismissed_reason">Reason *</Label>
              <textarea
                id="dismissed_reason"
                name="dismissed_reason"
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
              {pending ? "Saving…" : "Confirm"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
