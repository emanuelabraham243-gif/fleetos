import { NextResponse } from "next/server";

import { syncGpsConnection } from "@/lib/gps/sync";
import { createClient } from "@/lib/supabase/server";

/**
 * Dev/demo trigger: runs one pull cycle for every active GPS connection in
 * the caller's organization. A real deployment would call
 * `syncGpsConnection` from a scheduled job per connection instead of an
 * on-demand route, but the sync logic itself is identical either way.
 */
export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: connections, error } = await supabase
    .from("gps_connections")
    .select("id")
    .eq("status", "active");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results = await Promise.all(
    (connections ?? []).map(async (connection) => ({
      connectionId: connection.id,
      ...(await syncGpsConnection(supabase, connection.id)),
    })),
  );

  return NextResponse.json({ results });
}
