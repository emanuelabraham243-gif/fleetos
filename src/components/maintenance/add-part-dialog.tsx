"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { addMaintenancePart, type AddPartState } from "@/app/(app)/maintenance/work-orders/actions";
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

export function AddPartDialog({ workOrderId, vendors }: { workOrderId: string; vendors: { id: string; name: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<AddPartState, FormData>(addMaintenancePart, null);

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
          Add Part
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Part</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="work_order_id" value={workOrderId} />
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 flex flex-col gap-2">
              <Label htmlFor="part_name">Part name *</Label>
              <Input id="part_name" name="part_name" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="part_number">Part number</Label>
              <Input id="part_number" name="part_number" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input id="quantity" name="quantity" type="number" min={0.01} step="0.01" defaultValue="1" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="unit_cost">Unit cost (ETB) *</Label>
              <Input id="unit_cost" name="unit_cost" type="number" min={0} step="0.01" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="vendor_id">Supplier</Label>
              <select
                id="vendor_id"
                name="vendor_id"
                defaultValue=""
                className="border-input bg-background h-9 rounded-md border px-2 text-sm shadow-xs"
              >
                <option value="">Unknown</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {state && "error" in state ? (
            <p role="alert" className="text-destructive text-sm">
              {state.error}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Add Part"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
