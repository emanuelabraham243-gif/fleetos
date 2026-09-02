"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { assignDriver, type AssignDriverState } from "@/app/(app)/vehicles/[id]/actions";
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

export function AssignDriverDialog({
  vehicleId,
  drivers,
  currentDriverId,
}: {
  vehicleId: string;
  drivers: { id: string; full_name: string }[];
  currentDriverId: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const boundAction = assignDriver.bind(null, vehicleId);
  const [state, formAction, pending] = useActionState<AssignDriverState, FormData>(
    boundAction,
    null,
  );

  useEffect(() => {
    // Reacting to the server action's result, not deriving render state --
    // closing the dialog only after a real successful submission.
    if (state !== null && !("error" in state)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(false);
      router.refresh();
    }
  }, [state, router]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Assign Driver
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Driver</DialogTitle>
          <DialogDescription>
            The previous assignment (if any) is closed out, not deleted -- it stays in this
            vehicle&apos;s History tab.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="driverId">Driver</Label>
            <select
              id="driverId"
              name="driverId"
              defaultValue={currentDriverId ?? ""}
              className="border-input bg-background h-9 rounded-md border px-2 text-sm shadow-xs"
              required
            >
              <option value="" disabled>
                Select a driver
              </option>
              {drivers.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.full_name}
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
              {pending ? "Assigning…" : "Assign"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
