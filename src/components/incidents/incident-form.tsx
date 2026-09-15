"use client";

import { useActionState, useState } from "react";

import { reportIncident, type ReportIncidentState } from "@/app/(app)/issues/incidents/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { INCIDENT_SEVERITY_LABEL, INCIDENT_TYPE_LABEL } from "@/lib/i18n/labels";
import type { Database } from "@/lib/supabase/database.types";

const INCIDENT_TYPES = Object.keys(INCIDENT_TYPE_LABEL) as Database["public"]["Enums"]["incident_type"][];
const SEVERITIES = Object.keys(INCIDENT_SEVERITY_LABEL) as Database["public"]["Enums"]["incident_severity"][];

export function IncidentForm({
  vehicles,
  drivers,
  trips,
}: {
  vehicles: { id: string; unitNumber: string }[];
  drivers: { id: string; fullName: string }[];
  trips: { id: string; tripNumber: string; vehicleId: string }[];
}) {
  const [state, formAction, pending] = useActionState<ReportIncidentState, FormData>(reportIncident, null);
  const [vehicleId, setVehicleId] = useState("");
  const tripsForVehicle = vehicleId ? trips.filter((t) => t.vehicleId === vehicleId) : trips;

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="occurred_at">When *</Label>
          <Input id="occurred_at" name="occurred_at" type="datetime-local" required />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="incident_type">Type *</Label>
          <select
            id="incident_type"
            name="incident_type"
            defaultValue="other"
            required
            className="border-input bg-background h-9 rounded-md border px-2 text-sm shadow-xs"
          >
            {INCIDENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {INCIDENT_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="severity">Severity *</Label>
          <select
            id="severity"
            name="severity"
            defaultValue="low"
            required
            className="border-input bg-background h-9 rounded-md border px-2 text-sm shadow-xs"
          >
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>
                {INCIDENT_SEVERITY_LABEL[s]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="location">Location</Label>
          <Input id="location" name="location" placeholder="e.g. Debre Zeit expressway, km 12" />
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
            <option value="">Not trip-specific</option>
            {tripsForVehicle.map((t) => (
              <option key={t.id} value={t.id}>
                {t.tripNumber}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Description *</Label>
        <textarea
          id="description"
          name="description"
          rows={4}
          required
          placeholder="What happened -- as observed. E.g. 'Driver reported the trailer's rear left tire blew out on the expressway,' not 'driver was negligent.'"
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
          {pending ? "Saving…" : "Report Incident"}
        </Button>
      </div>
    </form>
  );
}
