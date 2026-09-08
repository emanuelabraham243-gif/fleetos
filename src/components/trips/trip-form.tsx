"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FormState = { error: string } | null;

export interface TripFormOptions {
  vehicles: { id: string; unitNumber: string }[];
  drivers: { id: string; fullName: string }[];
  clients: { id: string; name: string }[];
}

export function TripForm({
  action,
  options,
  submitLabel,
  defaultVehicleId,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  options: TripFormOptions;
  submitLabel: string;
  defaultVehicleId?: string;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, null);

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="vehicle_id">Vehicle *</Label>
          <select
            id="vehicle_id"
            name="vehicle_id"
            required
            defaultValue={defaultVehicleId ?? ""}
            className="border-input bg-background h-9 rounded-md border px-2 text-sm shadow-xs"
          >
            <option value="" disabled>
              Select a vehicle
            </option>
            {options.vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                Unit {v.unitNumber}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="driver_id">Driver</Label>
          <select
            id="driver_id"
            name="driver_id"
            defaultValue=""
            className="border-input bg-background h-9 rounded-md border px-2 text-sm shadow-xs"
          >
            <option value="">Unassigned for now</option>
            {options.drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.fullName}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="client_id">Client</Label>
          <select
            id="client_id"
            name="client_id"
            defaultValue=""
            className="border-input bg-background h-9 rounded-md border px-2 text-sm shadow-xs"
          >
            <option value="">No client on record</option>
            {options.clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="reference_number">Reference number</Label>
          <Input id="reference_number" name="reference_number" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="origin">Origin</Label>
          <Input id="origin" name="origin" placeholder="e.g. Addis Ababa" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="destination">Destination</Label>
          <Input id="destination" name="destination" placeholder="e.g. Dire Dawa" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="scheduled_start">Scheduled start *</Label>
          <Input id="scheduled_start" name="scheduled_start" type="datetime-local" required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="scheduled_end">Scheduled end</Label>
          <Input id="scheduled_end" name="scheduled_end" type="datetime-local" />
        </div>
      </div>

      <div className="flex flex-col gap-4 border-t pt-4">
        <p className="text-sm font-medium">Cargo</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="cargo_description">Description</Label>
            <Input id="cargo_description" name="cargo_description" placeholder="e.g. Cement, 50kg bags" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="cargo_quantity">Quantity</Label>
            <Input id="cargo_quantity" name="cargo_quantity" type="number" min={0} step="0.01" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="cargo_quantity_unit">Unit</Label>
            <Input id="cargo_quantity_unit" name="cargo_quantity_unit" placeholder="e.g. bags, pallets" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="cargo_weight_kg">Weight (kg)</Label>
            <Input id="cargo_weight_kg" name="cargo_weight_kg" type="number" min={0} step="0.1" />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="customer_notes">Customer notes</Label>
        <textarea
          id="customer_notes"
          name="customer_notes"
          rows={2}
          className="border-input bg-background rounded-md border px-3 py-2 text-sm shadow-xs"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="notes">Internal notes</Label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          className="border-input bg-background rounded-md border px-3 py-2 text-sm shadow-xs"
        />
      </div>

      {state?.error ? (
        <div className="flex flex-col gap-2">
          <p role="alert" className="text-destructive text-sm">
            {state.error}
          </p>
          {state.error.startsWith("Maintenance conflict:") ? (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="acknowledge_maintenance_conflict" />
              Acknowledge and continue anyway
            </label>
          ) : null}
        </div>
      ) : null}

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
