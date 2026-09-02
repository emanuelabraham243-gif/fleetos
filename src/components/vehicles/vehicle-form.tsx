"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface VehicleFormValues {
  unit_number: string;
  license_plate: string;
  make: string;
  model: string;
  year: string;
  vin: string;
  engine_number: string;
  fuel_type: string;
  capacity_kg: string;
  odometer_km: string;
  color: string;
  notes: string;
}

const FUEL_TYPES = ["diesel", "gasoline", "electric", "cng", "other"];

const EMPTY_VALUES: VehicleFormValues = {
  unit_number: "",
  license_plate: "",
  make: "",
  model: "",
  year: "",
  vin: "",
  engine_number: "",
  fuel_type: "diesel",
  capacity_kg: "",
  odometer_km: "",
  color: "",
  notes: "",
};

type FormState = { error: string } | null;

export function VehicleForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  defaultValues?: Partial<VehicleFormValues>;
  submitLabel: string;
}) {
  const values = { ...EMPTY_VALUES, ...defaultValues };
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, null);

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="unit_number">Vehicle identifier *</Label>
          <Input id="unit_number" name="unit_number" defaultValue={values.unit_number} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="license_plate">Plate number *</Label>
          <Input id="license_plate" name="license_plate" defaultValue={values.license_plate} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="make">Make *</Label>
          <Input id="make" name="make" defaultValue={values.make} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="model">Model *</Label>
          <Input id="model" name="model" defaultValue={values.model} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="year">Year *</Label>
          <Input id="year" name="year" type="number" min={1980} max={2100} defaultValue={values.year} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="vin">VIN / Chassis number *</Label>
          <Input id="vin" name="vin" defaultValue={values.vin} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="fuel_type">Fuel type *</Label>
          <select
            id="fuel_type"
            name="fuel_type"
            defaultValue={values.fuel_type}
            required
            className="border-input bg-background h-9 rounded-md border px-2 text-sm shadow-xs"
          >
            {FUEL_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="capacity_kg">Capacity (kg) *</Label>
          <Input
            id="capacity_kg"
            name="capacity_kg"
            type="number"
            min={0}
            step="0.1"
            defaultValue={values.capacity_kg}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="odometer_km">
            {defaultValues ? "Mileage (km) *" : "Initial mileage (km) *"}
          </Label>
          <Input
            id="odometer_km"
            name="odometer_km"
            type="number"
            min={0}
            step="0.1"
            defaultValue={values.odometer_km}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="engine_number">Engine number</Label>
          <Input id="engine_number" name="engine_number" defaultValue={values.engine_number} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="color">Color</Label>
          <Input id="color" name="color" defaultValue={values.color} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="notes">Notes</Label>
        <textarea
          id="notes"
          name="notes"
          defaultValue={values.notes}
          rows={3}
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
