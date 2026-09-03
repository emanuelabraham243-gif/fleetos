import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

export type DriverDocument = Database["public"]["Tables"]["driver_documents"]["Row"];

export type DriverDocumentWithUrl = DriverDocument & { signedUrl: string | null };

const SIGNED_URL_TTL_SECONDS = 60 * 60;

export async function getDriverDocuments(
  supabase: SupabaseClient<Database>,
  driverId: string,
): Promise<DriverDocumentWithUrl[]> {
  const { data, error } = await supabase
    .from("driver_documents")
    .select("*")
    .eq("driver_id", driverId)
    .order("expires_at", { ascending: true, nullsFirst: false });

  if (error) {
    throw new Error(`Failed to load driver documents: ${error.message}`);
  }

  // `file_url` stores the private Storage object path, not a public URL --
  // the "documents" bucket (Phase 1) has no public-read policy, so a
  // viewable link has to be a time-limited signed URL generated here,
  // never the raw path rendered as an href.
  return Promise.all(
    data.map(async (doc) => {
      if (!doc.file_url) return { ...doc, signedUrl: null };
      const { data: signed } = await supabase.storage
        .from("documents")
        .createSignedUrl(doc.file_url, SIGNED_URL_TTL_SECONDS);
      return { ...doc, signedUrl: signed?.signedUrl ?? null };
    }),
  );
}

/**
 * Lighter read for the `/drivers` list board -- it only needs to know
 * whether a document is expiring/expired, not a viewable link, so it skips
 * the per-document signed-URL round trip `getDriverDocuments` does.
 */
export async function getDriverDocumentExpiryDates(
  supabase: SupabaseClient<Database>,
  driverId: string,
): Promise<(string | null)[]> {
  const { data, error } = await supabase
    .from("driver_documents")
    .select("expires_at")
    .eq("driver_id", driverId);

  if (error) {
    throw new Error(`Failed to load driver document expiry: ${error.message}`);
  }
  return data.map((row) => row.expires_at);
}
