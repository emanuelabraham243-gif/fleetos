"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { transitionWorkOrderStatus, type TransitionWorkOrderState } from "@/app/(app)/maintenance/work-orders/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { WORK_ORDER_STATUS_LABEL } from "@/lib/i18n/labels";
import type { WorkOrderStatus } from "@/lib/domain/work-order";

export function WorkOrderStatusDialog({ workOrderId, toStatus }: { workOrderId: string; toStatus: WorkOrderStatus }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<TransitionWorkOrderState, FormData>(
    transitionWorkOrderStatus,
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
        <Button size="sm" variant={toStatus === "CANCELLED" ? "outline" : "default"}>
          {WORK_ORDER_STATUS_LABEL[toStatus]}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move to {WORK_ORDER_STATUS_LABEL[toStatus]}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="work_order_id" value={workOrderId} />
          <input type="hidden" name="to_status" value={toStatus} />
          {toStatus === "IN_REPAIR" ? (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="update_vehicle_status" defaultChecked />
              Also mark vehicle as In Maintenance
            </label>
          ) : null}
          {toStatus === "CANCELLED" ? (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="update_vehicle_status" defaultChecked />
              Return vehicle to Available (if no other open work order)
            </label>
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
