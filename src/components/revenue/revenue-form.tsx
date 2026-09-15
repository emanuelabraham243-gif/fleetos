"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FormState = { error: string } | null;

export function RevenueForm({
  action,
  clients,
  contracts,
  trips,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  clients: { id: string; name: string }[];
  contracts: { id: string; contractNumber: string; title: string; clientId: string }[];
  trips: { id: string; tripNumber: string; clientId: string | null }[];
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, null);
  const [clientId, setClientId] = useState("");
  const contractsForClient = clientId ? contracts.filter((c) => c.clientId === clientId) : contracts;
  const tripsForClient = clientId ? trips.filter((t) => t.clientId === clientId) : trips;

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="occurred_at">Date *</Label>
          <Input id="occurred_at" name="occurred_at" type="date" required />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="amount">Amount *</Label>
          <Input id="amount" name="amount" type="number" min={0.01} step="0.01" required />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="client_id">Client</Label>
          <select
            id="client_id"
            name="client_id"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="border-input bg-background h-9 rounded-md border px-2 text-sm shadow-xs"
          >
            <option value="">Not client-specific</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="contract_id">Contract</Label>
          <select
            id="contract_id"
            name="contract_id"
            defaultValue=""
            className="border-input bg-background h-9 rounded-md border px-2 text-sm shadow-xs"
          >
            <option value="">No contract</option>
            {contractsForClient.map((c) => (
              <option key={c.id} value={c.id}>
                {c.contractNumber} -- {c.title}
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
            {tripsForClient.map((t) => (
              <option key={t.id} value={t.id}>
                {t.tripNumber}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="currency">Currency</Label>
          <Input id="currency" name="currency" defaultValue="ETB" maxLength={3} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Description *</Label>
        <textarea
          id="description"
          name="description"
          rows={3}
          required
          placeholder="What this revenue was for -- as observed, not a projection."
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
          {pending ? "Saving…" : "Record Revenue"}
        </Button>
      </div>
    </form>
  );
}
