"use client";

import { useActionState, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PAYMENT_METHOD_LABEL } from "@/lib/i18n/labels";
import type { Database } from "@/lib/supabase/database.types";

type FormState = { error: string } | null;

const PAYMENT_METHODS = Object.keys(PAYMENT_METHOD_LABEL) as Database["public"]["Enums"]["payment_method"][];

export interface FuelFormVehicle {
  id: string;
  unitNumber: string;
  licensePlate: string | null;
  lastKnownOdometerKm: number | null;
}

export function FuelForm({
  action,
  vehicles,
  drivers,
  trips,
  vendors,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  vehicles: FuelFormVehicle[];
  drivers: { id: string; fullName: string }[];
  trips: { id: string; tripNumber: string; vehicleId: string }[];
  vendors: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, null);
  const [vehicleId, setVehicleId] = useState(vehicles[0]?.id ?? "");
  const [liters, setLiters] = useState("");
  const [pricePerLiter, setPricePerLiter] = useState("");
  const [showOverride, setShowOverride] = useState(false);

  const selectedVehicle = vehicles.find((v) => v.id === vehicleId) ?? null;
  const tripsForVehicle = trips.filter((t) => t.vehicleId === vehicleId);

  const total = useMemo(() => {
    const l = Number(liters);
    const p = Number(pricePerLiter);
    if (!Number.isFinite(l) || !Number.isFinite(p) || l <= 0 || p <= 0) return null;
    return Math.round(l * p * 100) / 100;
  }, [liters, pricePerLiter]);

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="vehicle_id">Vehicle *</Label>
          <select
            id="vehicle_id"
            name="vehicle_id"
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
            required
            className="border-input bg-background h-9 rounded-md border px-2 text-sm shadow-xs"
          >
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                Unit {v.unitNumber} {v.licensePlate ? `(${v.licensePlate})` : ""}
              </option>
            ))}
          </select>
          {selectedVehicle ? (
            <p className="text-muted-foreground text-xs">
              Last known odometer:{" "}
              {selectedVehicle.lastKnownOdometerKm !== null
                ? `${selectedVehicle.lastKnownOdometerKm.toLocaleString()} km`
                : "No reading on file"}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="occurred_at">Date / time *</Label>
          <Input id="occurred_at" name="occurred_at" type="datetime-local" required />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="volume_liters">Liters *</Label>
          <Input
            id="volume_liters"
            name="volume_liters"
            type="number"
            min={0.01}
            step="0.01"
            value={liters}
            onChange={(e) => setLiters(e.target.value)}
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="price_per_liter">Price / liter *</Label>
          <Input
            id="price_per_liter"
            name="price_per_liter"
            type="number"
            min={0.01}
            step="0.01"
            value={pricePerLiter}
            onChange={(e) => setPricePerLiter(e.target.value)}
            required
          />
        </div>

        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label>Total</Label>
          <p className="text-lg font-semibold">
            {total !== null ? total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"}
          </p>
          <p className="text-muted-foreground text-xs">Calculated automatically -- liters × price per liter.</p>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="odometer_km">Odometer reading (km) *</Label>
          <Input id="odometer_km" name="odometer_km" type="number" min={0} step="0.1" required />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="driver_id">Driver</Label>
          <select
            id="driver_id"
            name="driver_id"
            defaultValue=""
            className="border-input bg-background h-9 rounded-md border px-2 text-sm shadow-xs"
          >
            <option value="">Unassigned</option>
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
          <Label htmlFor="vendor_id">Fuel station (known vendor)</Label>
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
          <Label htmlFor="vendor_name">Fuel station name (if not listed above)</Label>
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
        <Label htmlFor="notes">Notes</Label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          className="border-input bg-background rounded-md border px-3 py-2 text-sm shadow-xs"
        />
      </div>

      <div className="flex flex-col gap-2 rounded-md border border-dashed p-3">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={showOverride} onChange={(e) => setShowOverride(e.target.checked)} />
          This odometer reading is lower than the last known reading, and I have a reason
        </label>
        {showOverride ? (
          <div className="flex flex-col gap-2">
            <Label htmlFor="odometer_override_reason">Reason *</Label>
            <textarea
              id="odometer_override_reason"
              name="odometer_override_reason"
              rows={2}
              required={showOverride}
              placeholder="e.g. odometer replaced, reading corrected, meter rolled over"
              className="border-input bg-background rounded-md border px-3 py-2 text-sm shadow-xs"
            />
          </div>
        ) : null}
      </div>

      {state?.error ? (
        <p role="alert" className="text-destructive text-sm">
          {state.error}
        </p>
      ) : null}

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Record Fuel"}
        </Button>
      </div>
    </form>
  );
}
