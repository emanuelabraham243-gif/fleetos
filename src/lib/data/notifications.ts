import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

/** Unread notification count for one user -- shown as the header bell badge. */
export async function getUnreadNotificationCount(
  supabase: SupabaseClient<Database>,
  profileId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("profile_id", profileId)
    .eq("is_read", false);

  if (error) {
    throw new Error(`Failed to load notification count: ${error.message}`);
  }

  return count ?? 0;
}
