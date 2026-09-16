"use client";

import { useActionState } from "react";

import { createRevenue, type CreateRevenueState } from "@/app/(app)/finance/revenue/actions";
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

export function RecordRevenueDialog({
  tripId,
  clientId,
  currency,
}: {
  tripId: string;
  clientId: string | null;
  currency: string;
}) {
  const [state, formAction, pending] = useActionState<CreateRevenueState, FormData>(createRevenue, null);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Record Revenue
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Revenue</DialogTitle>
          <DialogDescription>Records birr collected against this trip.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="trip_id" value={tripId} />
          <input type="hidden" name="client_id" value={clientId ?? ""} />
          <input type="hidden" name="return_to" value={`/trips/${tripId}`} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="occurred_at">Date *</Label>
              <Input
                id="occurred_at"
                name="occurred_at"
                type="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input id="amount" name="amount" type="number" min={0.01} step="0.01" required />
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="currency">Currency</Label>
              <Input id="currency" name="currency" defaultValue={currency} maxLength={3} />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Description *</Label>
            <textarea
              id="description"
              name="description"
              rows={2}
              required
              placeholder="e.g. Cargo delivered -- birr collected"
              className="border-input bg-background rounded-md border px-3 py-2 text-sm shadow-xs"
            />
          </div>

          {state?.error ? (
            <p role="alert" className="text-destructive text-sm">
              {state.error}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Record Revenue"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
