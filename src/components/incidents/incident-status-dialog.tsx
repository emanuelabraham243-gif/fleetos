"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { transitionIncidentStatus, type TransitionIncidentState } from "@/app/(app)/issues/incidents/actions";
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
import { nextIncidentStatuses, type IncidentStatus } from "@/lib/domain/incident";
import { INCIDENT_STATUS_LABEL } from "@/lib/i18n/labels";

export function IncidentStatusDialog({ incidentId, status }: { incidentId: string; status: IncidentStatus }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<TransitionIncidentState, FormData>(
    transitionIncidentStatus,
    null,
  );
  const options = nextIncidentStatuses(status);

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
          <DialogTitle>Change Incident Status</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="incident_id" value={incidentId} />
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
                  {INCIDENT_STATUS_LABEL[s]}
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
