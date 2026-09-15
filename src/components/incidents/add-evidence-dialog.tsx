"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { addIncidentEvidence, type AddEvidenceState } from "@/app/(app)/issues/incidents/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { EVIDENCE_KIND_LABEL, EVIDENCE_SOURCE_LABEL } from "@/lib/i18n/labels";
import type { Database } from "@/lib/supabase/database.types";

const KINDS = Object.keys(EVIDENCE_KIND_LABEL) as Database["public"]["Enums"]["evidence_kind"][];
const SOURCES = Object.keys(EVIDENCE_SOURCE_LABEL) as Database["public"]["Enums"]["evidence_source"][];

/** Every evidence entry is tagged what it *is* at the moment it's added -- a fact, a calculation, a statement someone gave, an interpretation, or a decision -- never left implicit. */
export function AddEvidenceDialog({ incidentId }: { incidentId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<AddEvidenceState, FormData>(addIncidentEvidence, null);

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
        <Button size="sm" variant="outline">
          Add Evidence
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Evidence</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="incident_id" value={incidentId} />
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="kind">Kind *</Label>
              <select
                id="kind"
                name="kind"
                required
                defaultValue=""
                className="border-input bg-background h-9 rounded-md border px-2 text-sm shadow-xs"
              >
                <option value="" disabled>
                  Select a kind
                </option>
                {KINDS.map((k) => (
                  <option key={k} value={k}>
                    {EVIDENCE_KIND_LABEL[k]}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="source">Source</Label>
              <select
                id="source"
                name="source"
                defaultValue="statement"
                className="border-input bg-background h-9 rounded-md border px-2 text-sm shadow-xs"
              >
                {SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {EVIDENCE_SOURCE_LABEL[s]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="content">Description *</Label>
            <textarea
              id="content"
              name="content"
              rows={3}
              required
              className="border-input bg-background rounded-md border px-3 py-2 text-sm shadow-xs"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="file">Attachment</Label>
            <input id="file" name="file" type="file" accept="image/*,application/pdf" className="text-sm" />
          </div>
          {state && "error" in state ? (
            <p role="alert" className="text-destructive text-sm">
              {state.error}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Add Evidence"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
