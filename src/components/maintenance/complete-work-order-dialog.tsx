"use client";

import { useActionState, useState } from "react";

import { completeWorkOrder, type CompleteWorkOrderState } from "@/app/(app)/maintenance/work-orders/actions";
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

export function CompleteWorkOrderDialog({
  workOrderId,
  schedules,
}: {
  workOrderId: string;
  schedules: { id: string; title: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<CompleteWorkOrderState, FormData>(completeWorkOrder, null);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Complete Work Order</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Complete Work Order</DialogTitle>
          <DialogDescription>
            Actual cost is calculated from recorded parts, labor, and linked expenses -- never entered directly.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="work_order_id" value={workOrderId} />

          <div className="flex flex-col gap-2">
            <Label htmlFor="completion_odometer_km">Completion mileage (km) *</Label>
            <Input id="completion_odometer_km" name="completion_odometer_km" type="number" min={0} step="0.1" required />
          </div>

          {schedules.length > 0 ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="maintenance_schedule_id">Fulfills schedule</Label>
              <select
                id="maintenance_schedule_id"
                name="maintenance_schedule_id"
                defaultValue=""
                className="border-input bg-background h-9 rounded-md border px-2 text-sm shadow-xs"
              >
                <option value="">Not linked to a schedule</option>
                {schedules.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
              <p className="text-muted-foreground text-xs">
                Linking a schedule updates its last-service date/mileage and recalculates when it&apos;s next due.
              </p>
            </div>
          ) : null}

          <div className="flex flex-col gap-2">
            <Label htmlFor="completion_notes">Work performed / final notes *</Label>
            <textarea
              id="completion_notes"
              name="completion_notes"
              rows={3}
              required
              className="border-input bg-background rounded-md border px-3 py-2 text-sm shadow-xs"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="update_vehicle_status" defaultChecked />
            Return vehicle to Available (if no other open work order)
          </label>

          {state?.error ? (
            <p role="alert" className="text-destructive text-sm">
              {state.error}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Complete"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
