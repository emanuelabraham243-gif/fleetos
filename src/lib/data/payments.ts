import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

const PAYMENT_LIST_SELECT =
  "*, client:clients(id, name), invoice:invoices(id, invoice_number), recorded_by_profile:profiles!payments_created_by_fkey(id, full_name)";

export type PaymentListItem = Database["public"]["Tables"]["payments"]["Row"] & {
  client: Pick<Database["public"]["Tables"]["clients"]["Row"], "id" | "name"> | null;
  invoice: Pick<Database["public"]["Tables"]["invoices"]["Row"], "id" | "invoice_number"> | null;
  recorded_by_profile: Pick<Database["public"]["Tables"]["profiles"]["Row"], "id" | "full_name"> | null;
};

/** The full payment history for `/finance/payments`' Payments Received table -- every payment in the caller's org, newest first. */
export async function getPaymentsList(supabase: SupabaseClient<Database>): Promise<PaymentListItem[]> {
  const { data, error } = await supabase
    .from("payments")
    .select(PAYMENT_LIST_SELECT)
    .order("paid_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load payments: ${error.message}`);
  }
  return data;
}
