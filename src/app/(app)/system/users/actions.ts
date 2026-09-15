"use server";

import { revalidatePath } from "next/cache";

import { getCurrentProfile } from "@/lib/data/profile";
import { canManageOrg } from "@/lib/domain/permissions";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type UpdateUserRoleState = { error: string } | { success: true } | null;

/** Owner/admin only, and never on your own account -- changing your own role could lock you out of the page that lets you change it. */
export async function updateUserRole(_prevState: UpdateUserRoleState, formData: FormData): Promise<UpdateUserRoleState> {
  const profile = await getCurrentProfile();
  if (!profile || !canManageOrg(profile.role)) {
    return { error: "You don't have permission to change user roles." };
  }

  const userId = String(formData.get("user_id") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  if (!userId || !role) return { error: "Missing user or role." };
  if (userId === profile.id) return { error: "You cannot change your own role." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role: role as Database["public"]["Enums"]["org_role"] })
    .eq("id", userId);
  if (error) return { error: error.message };

  revalidatePath("/system/users");
  return { success: true };
}

export type ToggleUserActiveState = { error: string } | { success: true } | null;

/** Deactivate/reactivate keeps the profile (and everything it's linked to) on file -- never a delete. Never on your own account, to avoid locking yourself out. */
export async function toggleUserActive(
  _prevState: ToggleUserActiveState,
  formData: FormData,
): Promise<ToggleUserActiveState> {
  const profile = await getCurrentProfile();
  if (!profile || !canManageOrg(profile.role)) {
    return { error: "You don't have permission to deactivate or reactivate users." };
  }

  const userId = String(formData.get("user_id") ?? "").trim();
  const action = String(formData.get("action") ?? "").trim();
  if (!userId || (action !== "deactivate" && action !== "reactivate")) {
    return { error: "Missing user or action." };
  }
  if (userId === profile.id) return { error: "You cannot deactivate your own account." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ deactivated_at: action === "deactivate" ? new Date().toISOString() : null })
    .eq("id", userId);
  if (error) return { error: error.message };

  revalidatePath("/system/users");
  return { success: true };
}
