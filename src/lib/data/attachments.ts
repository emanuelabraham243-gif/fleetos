import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

export type Attachment = Database["public"]["Tables"]["attachments"]["Row"];
export type AttachmentEntityType = Database["public"]["Tables"]["attachments"]["Row"]["entity_type"];

/** Every file attached to one entity (a delivery, a trip, ...), newest first -- the generic attachment/storage system from Phase 1. */
export async function getAttachmentsByEntity(
  supabase: SupabaseClient<Database>,
  entityType: AttachmentEntityType,
  entityId: string,
): Promise<Attachment[]> {
  const { data, error } = await supabase
    .from("attachments")
    .select("*")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load attachments: ${error.message}`);
  }
  return data;
}

const SIGNED_URL_TTL_SECONDS = 60 * 60;

export type AttachmentWithUrl = Attachment & { signedUrl: string | null };

/**
 * Same as `getAttachmentsByEntity`, plus a time-limited signed URL per file
 * -- `file_url` is a private "attachments" Storage object path, never a
 * public URL (Phase 6 confirmed the bucket has no public-read policy), so
 * a viewable link has to be generated here, never the raw path rendered
 * as an href.
 */
export async function getAttachmentsWithUrls(
  supabase: SupabaseClient<Database>,
  entityType: AttachmentEntityType,
  entityId: string,
): Promise<AttachmentWithUrl[]> {
  const attachments = await getAttachmentsByEntity(supabase, entityType, entityId);
  return Promise.all(
    attachments.map(async (a) => {
      const { data: signed } = await supabase.storage
        .from("attachments")
        .createSignedUrl(a.file_url, SIGNED_URL_TTL_SECONDS);
      return { ...a, signedUrl: signed?.signedUrl ?? null };
    }),
  );
}
