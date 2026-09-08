"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MAINTENANCE_ISSUE_SEVERITY_LABEL, MAINTENANCE_ISSUE_TYPE_LABEL } from "@/lib/i18n/labels";
import type { Database } from "@/lib/supabase/database.types";

type FormState = { error: string } | null;

const ISSUE_TYPES = Object.keys(MAINTENANCE_ISSUE_TYPE_LABEL) as Database["public"]["Enums"]["maintenance_issue_type"][];
const SEVERITIES = Object.keys(MAINTENANCE_ISSUE_SEVERITY_LABEL) as Database["public"]["Enums"]["maintenance_issue_severity"][];

export function IssueForm({
  action,
  vehicles,
  drivers,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  vehicles: { id: string; unitNumber: string }[];
  drivers: { id: string; fullName: string }[];
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
            defaultValue=""
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
          <Label htmlFor="issue_type">Issue type *</Label>
          <select
            id="issue_type"
            name="issue_type"
            defaultValue=""
            required
            className="border-input bg-background h-9 rounded-md border px-2 text-sm shadow-xs"
          >
            <option value="" disabled>
              Select a type
            </option>
            {ISSUE_TYPES.map((t) => (
              <option key={t} value={t}>
                {MAINTENANCE_ISSUE_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="severity">Severity *</Label>
          <select
            id="severity"
            name="severity"
            defaultValue="medium"
            required
            className="border-input bg-background h-9 rounded-md border px-2 text-sm shadow-xs"
          >
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>
                {MAINTENANCE_ISSUE_SEVERITY_LABEL[s]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="reported_at">Reported date/time *</Label>
          <Input id="reported_at" name="reported_at" type="datetime-local" required />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="driver_id">Driver</Label>
          <select
            id="driver_id"
            name="driver_id"
            defaultValue=""
            className="border-input bg-background h-9 rounded-md border px-2 text-sm shadow-xs"
          >
            <option value="">Not specified</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.fullName}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="odometer_km">Current mileage (km, if known)</Label>
          <Input id="odometer_km" name="odometer_km" type="number" min={0} step="0.1" />
        </div>

        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="photo">Photo</Label>
          <input id="photo" name="photo" type="file" accept="image/*" className="text-sm" />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="description">
          Description *<span className="text-muted-foreground ml-1 font-normal">-- what was observed, not a diagnosis</span>
        </Label>
        <textarea
          id="description"
          name="description"
          rows={3}
          required
          placeholder='e.g. "Engine temperature increased unexpectedly" -- not "Engine thermostat is broken"'
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
          {pending ? "Saving…" : "Report Issue"}
        </Button>
      </div>
    </form>
  );
}
