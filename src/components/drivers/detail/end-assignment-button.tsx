"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { endDriverAssignment, type EndAssignmentState } from "@/app/(app)/drivers/[id]/actions";
import { Button } from "@/components/ui/button";

export function EndAssignmentButton({ driverId }: { driverId: string }) {
  const router = useRouter();
  const boundAction = endDriverAssignment.bind(null, driverId);
  const [state, formAction, pending] = useActionState<EndAssignmentState, FormData>(
    boundAction,
    null,
  );

  useEffect(() => {
    if (state === null) return;
    if (!("error" in state)) {
      router.refresh();
    }
  }, [state, router]);

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <Button type="submit" variant="ghost" size="sm" disabled={pending}>
        {pending ? "Removing…" : "Remove Vehicle Assignment"}
      </Button>
      {state && "error" in state ? (
        <p role="alert" className="text-destructive text-xs">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
