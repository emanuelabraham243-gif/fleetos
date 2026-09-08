"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { addMaintenanceLabor, type AddLaborState } from "@/app/(app)/maintenance/work-orders/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AddLaborDialog({ workOrderId, vendors }: { workOrderId: string; vendors: { id: string; name: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [billingMode, setBillingMode] = useState<"hourly" | "fixed">("hourly");
  const [state, formAction, pending] = useActionState<AddLaborState, FormData>(addMaintenanceLabor, null);

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
          Add Labor
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Labor</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="work_order_id" value={workOrderId} />
          <input type="hidden" name="billing_mode" value={billingMode} />

          <div className="flex flex-col gap-2">
            <Label htmlFor="technician_name">Technician (internal, if no vendor)</Label>
            <Input id="technician_name" name="technician_name" />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="vendor_id">Vendor</Label>
            <select
              id="vendor_id"
              name="vendor_id"
              defaultValue=""
              className="border-input bg-background h-9 rounded-md border px-2 text-sm shadow-xs"
            >
              <option value="">None</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" name="description" placeholder="e.g. Brake pad replacement" />
          </div>

          <div className="flex gap-2 text-sm">
            <label className="flex items-center gap-1">
              <input
                type="radio"
                checked={billingMode === "hourly"}
                onChange={() => setBillingMode("hourly")}
              />
              Hourly
            </label>
            <label className="flex items-center gap-1">
              <input
                type="radio"
                checked={billingMode === "fixed"}
                onChange={() => setBillingMode("fixed")}
              />
              Fixed charge
            </label>
          </div>

          {billingMode === "hourly" ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="hours">Hours *</Label>
                <Input id="hours" name="hours" type="number" min={0.1} step="0.1" required />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="rate">Rate / hour (ETB) *</Label>
                <Input id="rate" name="rate" type="number" min={0} step="0.01" required />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Label htmlFor="fixed_amount">Fixed amount (ETB) *</Label>
              <Input id="fixed_amount" name="fixed_amount" type="number" min={0} step="0.01" required />
            </div>
          )}

          {state && "error" in state ? (
            <p role="alert" className="text-destructive text-sm">
              {state.error}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Add Labor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
