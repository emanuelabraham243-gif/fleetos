"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EXPENSE_CATEGORY_LABEL, PAYMENT_METHOD_LABEL } from "@/lib/i18n/labels";
import type { Database } from "@/lib/supabase/database.types";

type FormState = { error: string } | null;

const CATEGORIES = Object.keys(EXPENSE_CATEGORY_LABEL) as Database["public"]["Enums"]["expense_category"][];
const PAYMENT_METHODS = Object.keys(PAYMENT_METHOD_LABEL) as Database["public"]["Enums"]["payment_method"][];

export function ExpenseForm({
  action,
  vehicles,
  drivers,
  trips,
  vendors,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  vehicles: { id: string; unitNumber: string }[];
  drivers: { id: string; fullName: string }[];
  trips: { id: string; tripNumber: string; vehicleId: string }[];
  vendors: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, null);
  const [vehicleId, setVehicleId] = useState("");
  const tripsForVehicle = vehicleId ? trips.filter((t) => t.vehicleId === vehicleId) : trips;

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="occurred_at">Date *</Label>
          <Input id="occurred_at" name="occurred_at" type="date" required />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="category">Category *</Label>
          <select
            id="category"
            name="category"
            defaultValue="other"
            required
            className="border-input bg-background h-9 rounded-md border px-2 text-sm shadow-xs"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {EXPENSE_CATEGORY_LABEL[c]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="amount">Amount *</Label>
          <Input id="amount" name="amount" type="number" min={0.01} step="0.01" required />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="vehicle_id">Vehicle</Label>
          <select
            id="vehicle_id"
            name="vehicle_id"
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
            className="border-input bg-background h-9 rounded-md border px-2 text-sm shadow-xs"
          >
            <option value="">Not vehicle-specific</option>
            {vehicles.map((v) => (
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
            <option value="">Not driver-specific</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.fullName}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="trip_id">Trip</Label>
          <select
            id="trip_id"
            name="trip_id"
            defaultValue=""
            className="border-input bg-background h-9 rounded-md border px-2 text-sm shadow-xs"
          >
            <option value="">Unassigned</option>
            {tripsForVehicle.map((t) => (
              <option key={t.id} value={t.id}>
                {t.tripNumber}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="vendor_id">Vendor (known)</Label>
          <select
            id="vendor_id"
            name="vendor_id"
            defaultValue=""
            className="border-input bg-background h-9 rounded-md border px-2 text-sm shadow-xs"
          >
            <option value="">Unknown / not listed</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="vendor_name">Vendor name (if not listed above)</Label>
          <Input id="vendor_name" name="vendor_name" />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="payment_method">Payment method</Label>
          <select
            id="payment_method"
            name="payment_method"
            defaultValue=""
            className="border-input bg-background h-9 rounded-md border px-2 text-sm shadow-xs"
          >
            <option value="">Not recorded</option>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {PAYMENT_METHOD_LABEL[m]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="reference_number">Reference number</Label>
          <Input id="reference_number" name="reference_number" />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="receipt">Receipt</Label>
          <input id="receipt" name="receipt" type="file" accept="image/*,application/pdf" className="text-sm" />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Description *</Label>
        <textarea
          id="description"
          name="description"
          rows={3}
          required
          placeholder="What this expense was for -- as observed, not an interpretation."
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
          {pending ? "Saving…" : "Add Expense"}
        </Button>
      </div>
    </form>
  );
}
