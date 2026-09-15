"use client";

import { useActionState } from "react";

import { updateOrgSettings, type UpdateOrgSettingsState } from "@/app/(app)/system/settings/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function OrgSettingsForm({ name, timezone }: { name: string; timezone: string }) {
  const [state, formAction, pending] = useActionState<UpdateOrgSettingsState, FormData>(updateOrgSettings, null);

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Organization Name *</Label>
        <Input id="name" name="name" defaultValue={name} required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="timezone">Timezone *</Label>
        <Input id="timezone" name="timezone" defaultValue={timezone} required placeholder="e.g. Africa/Addis_Ababa" />
      </div>
      {state && "error" in state ? (
        <p role="alert" className="text-destructive text-sm">
          {state.error}
        </p>
      ) : null}
      {state && "success" in state ? <p className="text-sm text-green-600">Saved.</p> : null}
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
