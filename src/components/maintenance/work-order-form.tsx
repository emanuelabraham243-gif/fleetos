"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MAINTENANCE_TYPE_LABEL, WORK_ORDER_PRIORITY_LABEL } from "@/lib/i18n/labels";
import type { Database } from "@/lib/supabase/database.types";

type FormState = { error: string } | null;

const MAINTENANCE_TYPES = Object.keys(MAINTENANCE_TYPE_LABEL) as Database["public"]["Enums"]["maintenance_type"][];
const PRIORITIES = Object.keys(WORK_ORDER_PRIORITY_LABEL) as Database["public"]["Enums"]["work_order_priority"][];

export function WorkOrderForm({
  action,
  vehicles,
  issues,
  vendors,
  members,
  defaultVehicleId,
  defaultIssueId,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  vehicles: { id: string; unitNumber: string }[];
  issues: { id: string; title: string; vehicleId: string }[];
  vendors: { id: string; name: string }[];
  members: { id: string; fullName: string }[];
  defaultVehicleId?: string;
  defaultIssueId?: string;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, null);
  const [vehicleId, setVehicleId] = useState(defaultVehicleId ?? "");
  const issuesForVehicle = issues.filter((i) => i.vehicleId === vehicleId);

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
          <Label htmlFor="maintenance_issue_id">From issue (optional)</Label>
          <select
            id="maintenance_issue_id"
            name="maintenance_issue_id"
            defaultValue={defaultIssueId ?? ""}
            className="border-input bg-background h-9 rounded-md border px-2 text-sm shadow-xs"
          >
            <option value="">Not linked to an issue</option>
            {issuesForVehicle.map((i) => (
              <option key={i.id} value={i.id}>
                {i.title}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="title">Service type / title *</Label>
          <Input id="title" name="title" placeholder="e.g. Brake replacement" required />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="maintenance_type">Maintenance type *</Label>
          <select
            id="maintenance_type"
            name="maintenance_type"
            defaultValue="CORRECTIVE"
            required
            className="border-input bg-background h-9 rounded-md border px-2 text-sm shadow-xs"
          >
            {MAINTENANCE_TYPES.map((t) => (
              <option key={t} value={t}>
                {MAINTENANCE_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="priority">Priority *</Label>
          <select
            id="priority"
            name="priority"
            defaultValue="NORMAL"
            required
            className="border-input bg-background h-9 rounded-md border px-2 text-sm shadow-xs"
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {WORK_ORDER_PRIORITY_LABEL[p]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="odometer_km">Current mileage (km)</Label>
          <Input id="odometer_km" name="odometer_km" type="number" min={0} step="0.1" />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="vendor_id">Vendor (external)</Label>
          <select
            id="vendor_id"
            name="vendor_id"
            defaultValue=""
            className="border-input bg-background h-9 rounded-md border px-2 text-sm shadow-xs"
          >
            <option value="">None</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="assigned_to">Assigned technician (internal)</Label>
          <select
            id="assigned_to"
            name="assigned_to"
            defaultValue=""
            className="border-input bg-background h-9 rounded-md border px-2 text-sm shadow-xs"
          >
            <option value="">None</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.fullName}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="estimated_completion_at">Estimated completion</Label>
          <Input id="estimated_completion_at" name="estimated_completion_at" type="datetime-local" />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="estimated_cost">Estimated cost (ETB)</Label>
          <Input id="estimated_cost" name="estimated_cost" type="number" min={0} step="0.01" />
        </div>

        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="attachment">Attachment</Label>
          <input id="attachment" name="attachment" type="file" className="text-sm" />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          name="description"
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
          {pending ? "Saving…" : "Create Work Order"}
        </Button>
      </div>
    </form>
  );
}
