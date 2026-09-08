"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FormState = { error: string } | null;

export interface ScheduleFormValues {
  vehicle_id: string;
  title: string;
  interval_km: string;
  interval_days: string;
  last_done_at: string;
  last_done_odometer_km: string;
  is_active: boolean;
  notes: string;
}

const EMPTY_VALUES: ScheduleFormValues = {
  vehicle_id: "",
  title: "",
  interval_km: "",
  interval_days: "",
  last_done_at: "",
  last_done_odometer_km: "",
  is_active: true,
  notes: "",
};

export function ScheduleForm({
  action,
  vehicles,
  defaultValues,
  submitLabel,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  vehicles: { id: string; unitNumber: string }[];
  defaultValues?: Partial<ScheduleFormValues>;
  submitLabel: string;
}) {
  const values = { ...EMPTY_VALUES, ...defaultValues };
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, null);

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="vehicle_id">Vehicle *</Label>
          <select
            id="vehicle_id"
            name="vehicle_id"
            defaultValue={values.vehicle_id}
            required
            className="border-input bg-background h-9 rounded-md border px-2 text-sm shadow-xs"
          >
            <option value="" disabled>
              Select a vehicle
            </option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                Unit {v.unitNumber}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="title">Service type *</Label>
          <Input id="title" name="title" defaultValue={values.title} placeholder="e.g. Oil + Filter Service" required />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="interval_km">Interval (km)</Label>
          <Input id="interval_km" name="interval_km" type="number" min={1} defaultValue={values.interval_km} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="interval_days">Interval (days)</Label>
          <Input id="interval_days" name="interval_days" type="number" min={1} defaultValue={values.interval_days} />
        </div>

        <p className="text-muted-foreground text-xs sm:col-span-2">
          Set mileage only, time only, or both -- both means either condition due triggers the service. At least one
          is required.
        </p>

        <div className="flex flex-col gap-2">
          <Label htmlFor="last_done_at">Last service date</Label>
          <Input id="last_done_at" name="last_done_at" type="date" defaultValue={values.last_done_at} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="last_done_odometer_km">Last service mileage (km)</Label>
          <Input
            id="last_done_odometer_km"
            name="last_done_odometer_km"
            type="number"
            min={0}
            defaultValue={values.last_done_odometer_km}
          />
        </div>
      </div>

      <p className="text-muted-foreground text-xs">
        Next due date/mileage is calculated automatically from the interval and the last-service facts above -- it
        is never entered directly.
      </p>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="is_active" defaultChecked={values.is_active} />
        Active
      </label>

      <div className="flex flex-col gap-2">
        <Label htmlFor="notes">Notes</Label>
        <textarea
          id="notes"
          name="notes"
          defaultValue={values.notes}
          rows={2}
          className="border-input bg-background rounded-md border px-3 py-2 text-sm shadow-xs"
        />
      </div>

      {state?.error ? (
        <p role="alert" className="text-destructive text-sm">
          {state.error}
        </p>
      ) : null}

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
