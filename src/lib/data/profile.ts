import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type CurrentProfile = Database["public"]["Tables"]["profiles"]["Row"] & {
  organization: Database["public"]["Tables"]["organizations"]["Row"];
};

/**
 * Loads the signed-in user's profile together with their organization.
 * Returns null when there is no session -- callers in protected routes can
 * assume proxy.ts already redirected unauthenticated visitors, but this is
 * still the boundary that should never throw on a missing session.
 */
export async function getCurrentProfile(): Promise<CurrentProfile | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*, organization:organizations(*)")
    .eq("id", user.id)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

/** Every active member of the caller's organization -- for internal-assignee pickers (e.g. Work Order technician). */
export async function getOrgMembers(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<Pick<Database["public"]["Tables"]["profiles"]["Row"], "id" | "full_name">[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name")
    .is("deactivated_at", null)
    .order("full_name", { ascending: true });

  if (error) {
    throw new Error(`Failed to load organization members: ${error.message}`);
  }
  return data;
}
