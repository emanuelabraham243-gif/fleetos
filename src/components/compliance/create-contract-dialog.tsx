"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { createContract, type CreateContractState } from "@/app/(app)/compliance/contracts/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CONTRACT_RATE_TYPE_LABEL } from "@/lib/i18n/labels";
import type { Database } from "@/lib/supabase/database.types";

const RATE_TYPES = Object.keys(CONTRACT_RATE_TYPE_LABEL) as Database["public"]["Enums"]["contract_rate_type"][];

export function CreateContractDialog({ clients }: { clients: { id: string; name: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<CreateContractState, FormData>(createContract, null);

  useEffect(() => {
    if (state && "success" in state) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(false);
      router.refresh();
    }
  }, [state, router]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Contract</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Contract</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 flex flex-col gap-2">
              <Label htmlFor="client_id">Client *</Label>
              <select
                id="client_id"
                name="client_id"
                required
                defaultValue=""
                className="border-input bg-background h-9 rounded-md border px-2 text-sm shadow-xs"
              >
                <option value="" disabled>
                  Select a client
                </option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2 flex flex-col gap-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" name="title" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="rate_type">Rate type</Label>
              <select
                id="rate_type"
                name="rate_type"
                defaultValue="flat"
                className="border-input bg-background h-9 rounded-md border px-2 text-sm shadow-xs"
              >
                {RATE_TYPES.map((r) => (
                  <option key={r} value={r}>
                    {CONTRACT_RATE_TYPE_LABEL[r]}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="rate_amount">Rate amount</Label>
              <Input id="rate_amount" name="rate_amount" type="number" min={0} step="0.01" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="start_date">Start date</Label>
              <Input id="start_date" name="start_date" type="date" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="end_date">End date</Label>
              <Input id="end_date" name="end_date" type="date" />
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
          {state && "error" in state ? (
            <p role="alert" className="text-destructive text-sm">
              {state.error}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Create Contract"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
