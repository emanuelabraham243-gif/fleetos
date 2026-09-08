"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { createIssueFromInspectionItem, type CreateIssueFromItemState } from "@/app/(app)/inspections/actions";
import { Button } from "@/components/ui/button";

export function CreateIssueFromItemButton({
  itemId,
  inspectionId,
  vehicleId,
  category,
  itemName,
  note,
  severity,
}: {
  itemId: string;
  inspectionId: string;
  vehicleId: string;
  category: string;
  itemName: string;
  note: string | null;
  severity: string | null;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<CreateIssueFromItemState, FormData>(
    createIssueFromInspectionItem,
    null,
  );

  useEffect(() => {
    if (state && "success" in state) {
      router.refresh();
    }
  }, [state, router]);

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <input type="hidden" name="item_id" value={itemId} />
      <input type="hidden" name="inspection_id" value={inspectionId} />
      <input type="hidden" name="vehicle_id" value={vehicleId} />
      <input type="hidden" name="category" value={category} />
      <input type="hidden" name="item_name" value={itemName} />
      <input type="hidden" name="note" value={note ?? ""} />
      <input type="hidden" name="severity" value={severity ?? "medium"} />
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? "Creating…" : "Create Maintenance Issue"}
      </Button>
      {state && "error" in state ? <p className="text-destructive text-xs">{state.error}</p> : null}
    </form>
  );
}
