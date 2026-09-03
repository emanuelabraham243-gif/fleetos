"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { uploadDriverDocument, type UploadDriverDocumentState } from "@/app/(app)/drivers/[id]/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DRIVER_DOCUMENT_TYPE_LABEL } from "@/lib/i18n/labels";
import type { Database } from "@/lib/supabase/database.types";

const DOCUMENT_TYPES: Database["public"]["Enums"]["document_type_driver"][] = [
  "license",
  "medical_card",
  "background_check",
  "training_certificate",
  "other",
];

export function UploadDocumentDialog({ driverId }: { driverId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const boundAction = uploadDriverDocument.bind(null, driverId);
  const [state, formAction, pending] = useActionState<UploadDriverDocumentState, FormData>(
    boundAction,
    null,
  );

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
        <Button variant="outline" size="sm">
          Upload Document
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Documents are never deleted -- a renewed document is added as a new record, keeping the
            expired one visible in history.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="document_type">Document type</Label>
            <select
              id="document_type"
              name="document_type"
              defaultValue=""
              required
              className="border-input bg-background h-9 rounded-md border px-2 text-sm shadow-xs"
            >
              <option value="" disabled>
                Select a type
              </option>
              {DOCUMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {DRIVER_DOCUMENT_TYPE_LABEL[type]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="document_number">Document number</Label>
            <Input id="document_number" name="document_number" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="issued_at">Issue date</Label>
              <Input id="issued_at" name="issued_at" type="date" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="expires_at">Expiry date</Label>
              <Input id="expires_at" name="expires_at" type="date" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="file">File</Label>
            <input id="file" name="file" type="file" accept="image/*,application/pdf" className="text-sm" />
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
              {pending ? "Uploading…" : "Upload"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
