"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { assignVehicleToDriver, type AssignVehicleState } from "@/app/(app)/drivers/[id]/actions";
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

export function AssignVehicleDialog({
  driverId,
  vehicles,
  currentVehicleId,
}: {
  driverId: string;
  vehicles: { id: string; unit_number: string }[];
  currentVehicleId: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState(currentVehicleId ?? "");
  const boundAction = assignVehicleToDriver.bind(null, driverId);
  const [state, formAction, pending] = useActionState<AssignVehicleState, FormData>(
    boundAction,
    null,
  );

  useEffect(() => {
    // Reacting to the server action's result, not deriving render state --
    // closing the dialog only after a real successful submission (no error,
    // no warning still pending confirmation).
    if (state === null) return;
    if (!("error" in state) && !("warning" in state)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(false);
      router.refresh();
    }
  }, [state, router]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Assign Vehicle
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Vehicle</DialogTitle>
          <DialogDescription>
            The previous assignment (if any) is closed out, not deleted -- it stays in this driver&apos;s
            Activity history.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="vehicleId">Vehicle</Label>
            <select
              id="vehicleId"
              name="vehicleId"
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              className="border-input bg-background h-9 rounded-md border px-2 text-sm shadow-xs"
              required
            >
              <option value="" disabled>
                Select a vehicle
              </option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  Unit {vehicle.unit_number}
                </option>
              ))}
            </select>
          </div>

          {state && "warning" in state ? (
            <div className="border-amber-500/50 bg-muted/50 flex flex-col gap-2 rounded-md border p-3">
              <p className="text-sm">{state.warning}</p>
              <input type="hidden" name="force" value="true" />
              <Button type="submit" variant="destructive" size="sm" disabled={pending}>
                Assign Anyway
              </Button>
            </div>
          ) : null}

          {state && "error" in state ? (
            <p role="alert" className="text-destructive text-sm">
              {state.error}
            </p>
          ) : null}

          {!(state && "warning" in state) ? (
            <DialogFooter>
              <Button type="submit" disabled={pending}>
                {pending ? "Assigning…" : "Assign"}
              </Button>
            </DialogFooter>
          ) : null}
        </form>
      </DialogContent>
    </Dialog>
  );
}
