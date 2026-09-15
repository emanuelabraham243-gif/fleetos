import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

const SIGNED_URL_TTL_SECONDS = 60 * 60;

export type FleetVehicleDocument = Database["public"]["Tables"]["vehicle_documents"]["Row"] & {
  vehicle: Pick<Database["public"]["Tables"]["vehicles"]["Row"], "id" | "unit_number"> | null;
  signedUrl: string | null;
};

export type FleetDriverDocument = Database["public"]["Tables"]["driver_documents"]["Row"] & {
  driver: Pick<Database["public"]["Tables"]["drivers"]["Row"], "id" | "full_name"> | null;
  signedUrl: string | null;
};

/**
 * Fleet-wide view for `/compliance/documents` -- every vehicle document
 * across the organization, with a signed URL rather than the raw storage
 * path the per-vehicle DocumentsTab renders directly (the "documents"
 * bucket is private, so a viewable link has to be time-limited, the same
 * pattern `getDriverDocuments` already uses for driver documents).
 */
export async function getAllVehicleDocuments(supabase: SupabaseClient<Database>): Promise<FleetVehicleDocument[]> {
  const { data, error } = await supabase
    .from("vehicle_documents")
    .select("*, vehicle:vehicles(id, unit_number)")
    .order("expires_at", { ascending: true, nullsFirst: false });

  if (error) {
    throw new Error(`Failed to load vehicle documents: ${error.message}`);
  }

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

export async function getAllDriverDocuments(supabase: SupabaseClient<Database>): Promise<FleetDriverDocument[]> {
  const { data, error } = await supabase
    .from("driver_documents")
    .select("*, driver:drivers(id, full_name)")
    .order("expires_at", { ascending: true, nullsFirst: false });

  if (error) {
    throw new Error(`Failed to load driver documents: ${error.message}`);
  }

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
