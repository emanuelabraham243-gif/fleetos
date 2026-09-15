import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

const INVOICE_LIST_SELECT = "*, client:clients(id, name), payments(id, amount, status)";

export type InvoiceListItem = Database["public"]["Tables"]["invoices"]["Row"] & {
  client: Pick<Database["public"]["Tables"]["clients"]["Row"], "id" | "name"> | null;
  payments: Pick<Database["public"]["Tables"]["payments"]["Row"], "id" | "amount" | "status">[];
};

/** Every invoice in the caller's org (RLS-scoped), newest issue date first. No date-range filter -- unlike Fuel/Expenses, outstanding balance matters regardless of when an invoice was issued. */
export async function getInvoicesList(supabase: SupabaseClient<Database>): Promise<InvoiceListItem[]> {
  const { data, error } = await supabase
    .from("invoices")
    .select(INVOICE_LIST_SELECT)
    .order("issue_date", { ascending: false });

  if (error) {
    throw new Error(`Failed to load invoices: ${error.message}`);
  }
  return data;
}

/** Single-invoice read used by the send/void/record-payment actions to check current state before writing. */
export async function getInvoiceById(
  supabase: SupabaseClient<Database>,
  invoiceId: string,
): Promise<Database["public"]["Tables"]["invoices"]["Row"] | null> {
  const { data, error } = await supabase.from("invoices").select("*").eq("id", invoiceId).maybeSingle();
  if (error) {
    throw new Error(`Failed to load invoice: ${error.message}`);
  }
  return data;
}

/** Active (non-voided) payments recorded against one invoice, newest first -- used to show a per-invoice payment history and to recompute its balance before a write. */
export async function getPaymentsForInvoice(
  supabase: SupabaseClient<Database>,
  invoiceId: string,
): Promise<Database["public"]["Tables"]["payments"]["Row"][]> {
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("invoice_id", invoiceId)
    .order("paid_at", { ascending: false });
  if (error) {
    throw new Error(`Failed to load payments for invoice: ${error.message}`);
  }
  return data;
}
