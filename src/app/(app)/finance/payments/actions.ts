"use server";

import { revalidatePath } from "next/cache";

import { getInvoiceById, getPaymentsForInvoice } from "@/lib/data/invoices";
import { getCurrentProfile } from "@/lib/data/profile";
import { computeActivePaymentsTotal } from "@/lib/domain/invoice";
import { canManageFleet } from "@/lib/domain/permissions";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

async function nextInvoiceNumber(supabase: Supabase): Promise<string> {
  const { count, error } = await supabase.from("invoices").select("id", { count: "exact", head: true });
  if (error) {
    throw new Error(`Failed to determine next invoice number: ${error.message}`);
  }
  return `INV-${String((count ?? 0) + 1).padStart(3, "0")}`;
}

export type CreateInvoiceState = { error: string } | { success: true } | null;

/** Create Invoice -- always starts DRAFT, total is always subtotal + tax computed here, never a submitted total that could drift from the two numbers that produced it. */
export async function createInvoice(_prevState: CreateInvoiceState, formData: FormData): Promise<CreateInvoiceState> {
  const profile = await getCurrentProfile();
  if (!profile || !canManageFleet(profile.role)) {
    return { error: "You don't have permission to create invoices." };
  }

  const clientId = String(formData.get("client_id") ?? "").trim();
  if (!clientId) return { error: "A client is required." };

  const issueDate = String(formData.get("issue_date") ?? "").trim();
  if (!issueDate) return { error: "An issue date is required." };

  const dueDate = String(formData.get("due_date") ?? "").trim() || null;

  const subtotalAmount = Number(formData.get("subtotal_amount"));
  if (!Number.isFinite(subtotalAmount) || subtotalAmount <= 0) {
    return { error: "Subtotal must be a positive number." };
  }
  const taxAmountRaw = String(formData.get("tax_amount") ?? "").trim();
  const taxAmount = taxAmountRaw ? Number(taxAmountRaw) : 0;
  if (!Number.isFinite(taxAmount) || taxAmount < 0) {
    return { error: "Tax must be a non-negative number." };
  }

  const currency = String(formData.get("currency") ?? "ETB").trim() || "ETB";
  const notes = String(formData.get("notes") ?? "").trim() || null;

  const supabase = await createClient();
  const invoiceNumber = await nextInvoiceNumber(supabase);

  const insertValues: Database["public"]["Tables"]["invoices"]["Insert"] = {
    organization_id: profile.organization_id,
    client_id: clientId,
    invoice_number: invoiceNumber,
    status: "draft",
    issue_date: issueDate,
    due_date: dueDate,
    subtotal_amount: subtotalAmount,
    tax_amount: taxAmount,
    total_amount: Math.round((subtotalAmount + taxAmount) * 100) / 100,
    currency,
    notes,
  };

  const { error } = await supabase.from("invoices").insert(insertValues);
  if (error) return { error: error.message };

  revalidatePath("/finance/payments");
  return { success: true };
}

export type InvoiceActionState = { error: string } | { success: true } | null;

/** DRAFT -> SENT. The only transition that makes an invoice count toward outstanding/overdue totals. */
export async function sendInvoice(_prevState: InvoiceActionState, formData: FormData): Promise<InvoiceActionState> {
  const profile = await getCurrentProfile();
  if (!profile || !canManageFleet(profile.role)) {
    return { error: "You don't have permission to send invoices." };
  }

  const invoiceId = String(formData.get("invoice_id") ?? "").trim();
  if (!invoiceId) return { error: "Missing invoice." };

  const supabase = await createClient();
  const invoice = await getInvoiceById(supabase, invoiceId);
  if (!invoice) return { error: "Invoice not found." };
  if (invoice.status !== "draft") return { error: "Only a draft invoice can be sent." };
  if (Number(invoice.total_amount) <= 0) return { error: "This invoice has no billable amount." };

  const { error } = await supabase.from("invoices").update({ status: "sent" }).eq("id", invoiceId);
  if (error) return { error: error.message };

  revalidatePath("/finance/payments");
  return { success: true };
}

/** DRAFT/SENT -> VOID. Refuses to void an invoice that already has an active payment against it -- void the payment first, never let the two facts disagree. */
export async function voidInvoice(_prevState: InvoiceActionState, formData: FormData): Promise<InvoiceActionState> {
  const profile = await getCurrentProfile();
  if (!profile || !canManageFleet(profile.role)) {
    return { error: "You don't have permission to void invoices." };
  }

  const invoiceId = String(formData.get("invoice_id") ?? "").trim();
  const reason = String(formData.get("void_reason") ?? "").trim();
  if (!invoiceId) return { error: "Missing invoice." };
  if (!reason) return { error: "A reason is required to void an invoice." };

  const supabase = await createClient();
  const invoice = await getInvoiceById(supabase, invoiceId);
  if (!invoice) return { error: "Invoice not found." };
  if (invoice.status === "void") return { error: "This invoice is already void." };

  const payments = await getPaymentsForInvoice(supabase, invoiceId);
  if (computeActivePaymentsTotal(payments) > 0) {
    return { error: "This invoice has active payments recorded -- void those first." };
  }

  const stamp = `[Voided ${new Date().toISOString()}] ${reason}`;
  const { error } = await supabase
    .from("invoices")
    .update({ status: "void", notes: invoice.notes ? `${invoice.notes}\n${stamp}` : stamp })
    .eq("id", invoiceId);
  if (error) return { error: error.message };

  revalidatePath("/finance/payments");
  return { success: true };
}

export type RecordPaymentState = { error: string } | { success: true } | null;

/** Record Payment -- only against a SENT invoice (never draft or void); never blocked by exceeding the outstanding balance, since real overpayments/credits happen. */
export async function recordPayment(_prevState: RecordPaymentState, formData: FormData): Promise<RecordPaymentState> {
  const profile = await getCurrentProfile();
  if (!profile || !canManageFleet(profile.role)) {
    return { error: "You don't have permission to record payments." };
  }

  const invoiceId = String(formData.get("invoice_id") ?? "").trim();
  if (!invoiceId) return { error: "Missing invoice." };

  const amount = Number(formData.get("amount"));
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Amount must be a positive number." };

  const paidAtRaw = String(formData.get("paid_at") ?? "").trim();
  const paidAt = paidAtRaw ? new Date(paidAtRaw) : new Date();
  if (Number.isNaN(paidAt.getTime())) return { error: "Date is not valid." };

  const method = String(formData.get("method") ?? "bank_transfer").trim();
  const reference = String(formData.get("reference") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  const supabase = await createClient();
  const invoice = await getInvoiceById(supabase, invoiceId);
  if (!invoice) return { error: "Invoice not found." };
  if (invoice.status === "draft") return { error: "Send this invoice before recording a payment against it." };
  if (invoice.status === "void") return { error: "This invoice is void." };

  const insertValues: Database["public"]["Tables"]["payments"]["Insert"] = {
    organization_id: profile.organization_id,
    invoice_id: invoiceId,
    client_id: invoice.client_id,
    amount,
    currency: invoice.currency,
    method: method as Database["public"]["Enums"]["payment_method"],
    paid_at: paidAt.toISOString(),
    reference,
    notes,
    created_by: profile.id,
  };

  const { error } = await supabase.from("payments").insert(insertValues);
  if (error) return { error: error.message };

  revalidatePath("/finance/payments");
  return { success: true };
}

export type VoidPaymentState = { error: string } | { success: true } | null;

/** Payments are never hard-deleted -- voiding a wrongly-entered payment restores the invoice's balance, with the reason attached. */
export async function voidPayment(_prevState: VoidPaymentState, formData: FormData): Promise<VoidPaymentState> {
  const profile = await getCurrentProfile();
  if (!profile || !canManageFleet(profile.role)) {
    return { error: "You don't have permission to void payments." };
  }

  const paymentId = String(formData.get("payment_id") ?? "").trim();
  const reason = String(formData.get("void_reason") ?? "").trim();
  if (!paymentId) return { error: "Missing payment." };
  if (!reason) return { error: "A reason is required to void a payment." };

  const supabase = await createClient();
  const { data: existing, error: fetchError } = await supabase
    .from("payments")
    .select("notes")
    .eq("id", paymentId)
    .maybeSingle();
  if (fetchError) return { error: fetchError.message };
  if (!existing) return { error: "Payment not found." };

  const stamp = `[Voided ${new Date().toISOString()}] ${reason}`;
  const { error } = await supabase
    .from("payments")
    .update({ status: "voided", notes: existing.notes ? `${existing.notes}\n${stamp}` : stamp })
    .eq("id", paymentId);
  if (error) return { error: error.message };

  revalidatePath("/finance/payments");
  return { success: true };
}
