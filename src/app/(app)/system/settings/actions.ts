"use server";

import { revalidatePath } from "next/cache";

import { getCurrentProfile } from "@/lib/data/profile";
import { canManageOrg } from "@/lib/domain/permissions";
import { createClient } from "@/lib/supabase/server";

export type UpdateOrgSettingsState = { error: string } | { success: true } | null;

/** Organization profile -- name and timezone. Owner/admin only, mirrors the DB's own is_org_admin() RLS check on `organizations`. */
export async function updateOrgSettings(
  _prevState: UpdateOrgSettingsState,
  formData: FormData,
): Promise<UpdateOrgSettingsState> {
  const profile = await getCurrentProfile();
  if (!profile || !canManageOrg(profile.role)) {
    return { error: "You don't have permission to change organization settings." };
  }

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "An organization name is required." };

  const timezone = String(formData.get("timezone") ?? "").trim();
  if (!timezone) return { error: "A timezone is required." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("organizations")
    .update({ name, timezone })
    .eq("id", profile.organization_id);
  if (error) return { error: error.message };

  revalidatePath("/system/settings");
  return { success: true };
}
