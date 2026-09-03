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
