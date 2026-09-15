"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import {
  toggleUserActive,
  updateUserRole,
  type ToggleUserActiveState,
  type UpdateUserRoleState,
} from "@/app/(app)/system/users/actions";
import { Button } from "@/components/ui/button";
import { ORG_ROLE_LABEL } from "@/lib/i18n/labels";
import type { Database } from "@/lib/supabase/database.types";

const ROLES = Object.keys(ORG_ROLE_LABEL) as Database["public"]["Enums"]["org_role"][];

export function UserRowActions({
  userId,
  role,
  isDeactivated,
  isSelf,
}: {
  userId: string;
  role: Database["public"]["Enums"]["org_role"];
  isDeactivated: boolean;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [roleState, roleAction, rolePending] = useActionState<UpdateUserRoleState, FormData>(updateUserRole, null);
  const [toggleState, toggleAction, togglePending] = useActionState<ToggleUserActiveState, FormData>(
    toggleUserActive,
    null,
  );

  useEffect(() => {
    if (roleState && "success" in roleState) router.refresh();
  }, [roleState, router]);

  useEffect(() => {
    if (toggleState && "success" in toggleState) router.refresh();
  }, [toggleState, router]);

  if (isSelf) {
    return <span className="text-muted-foreground text-xs">This is you</span>;
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <form action={roleAction} className="flex items-center gap-1">
          <input type="hidden" name="user_id" value={userId} />
          <select
            name="role"
            defaultValue={role}
            onChange={(e) => e.currentTarget.form?.requestSubmit()}
            disabled={rolePending}
            className="border-input bg-background h-8 rounded-md border px-2 text-xs shadow-xs"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ORG_ROLE_LABEL[r]}
              </option>
            ))}
          </select>
        </form>
        <form action={toggleAction}>
          <input type="hidden" name="user_id" value={userId} />
          <input type="hidden" name="action" value={isDeactivated ? "reactivate" : "deactivate"} />
          <Button type="submit" size="sm" variant="outline" disabled={togglePending}>
            {isDeactivated ? "Reactivate" : "Deactivate"}
          </Button>
        </form>
      </div>
      {roleState && "error" in roleState ? <p className="text-destructive text-xs">{roleState.error}</p> : null}
      {toggleState && "error" in toggleState ? <p className="text-destructive text-xs">{toggleState.error}</p> : null}
    </div>
  );
}
