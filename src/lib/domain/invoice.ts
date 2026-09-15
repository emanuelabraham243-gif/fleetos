import { daysUntil } from "@/lib/days-until";
import type { Database } from "@/lib/supabase/database.types";

export type InvoiceStatus = Database["public"]["Enums"]["invoice_status"];
/** Stored values the app itself ever writes -- "paid" and "overdue" are display-only, derived below. */
export type StoredInvoiceStatus = Extract<InvoiceStatus, "draft" | "sent" | "void">;

export type InvoiceDisplayStatus = "DRAFT" | "SENT" | "OVERDUE" | "PAID" | "VOID";

/**
 * "Paid" and "overdue" are never stored -- they're facts that can go stale
 * the moment a payment posts or a day passes, so (like maintenance due
 * status and driver document status) they're always computed at read time
 * from the balance and due date, never a column that needs a cron to keep
 * in sync. The app only ever writes `draft`/`sent`/`void` to `status`.
 */
export function computeInvoiceDisplayStatus(
  status: StoredInvoiceStatus,
  balance: number,
  dueDate: string | null,
  now: Date = new Date(),
): InvoiceDisplayStatus {
  if (status === "void") return "VOID";
  if (status === "draft") return "DRAFT";
  if (balance <= 0) return "PAID";
  if (dueDate && daysUntil(dueDate, now) < 0) return "OVERDUE";
  return "SENT";
}

/** Balance is always total minus active (non-voided) payments -- never a stored, separately-editable number. */
export function computeInvoiceBalance(totalAmount: number, activePaymentsTotal: number): number {
  return Math.round((totalAmount - activePaymentsTotal) * 100) / 100;
}

type PaymentLike = { amount: number | string; status: Database["public"]["Enums"]["record_state"] };
type InvoiceLike = {
  status: InvoiceStatus;
  total_amount: number | string;
  due_date: string | null;
  currency: string;
  payments: PaymentLike[];
};

/** Active (non-voided) payments' total against one invoice -- the only thing `computeInvoiceBalance` ever subtracts. */
export function computeActivePaymentsTotal(payments: PaymentLike[]): number {
  return payments.filter((p) => p.status === "active").reduce((sum, p) => sum + Number(p.amount), 0);
}

export interface InvoiceSummary {
  /** Sum of balances across every non-void, non-draft invoice with a positive balance. */
  outstandingTotal: number;
  overdueCount: number;
  overdueTotal: number;
  draftCount: number;
  currency: string;
}

/** Summary cards for `/finance/payments` -- pure combine over an already-fetched invoice list, no query of its own. */
export function computeInvoiceSummary(invoices: InvoiceLike[], now: Date = new Date()): InvoiceSummary {
  let outstandingTotal = 0;
  let overdueCount = 0;
  let overdueTotal = 0;
  let draftCount = 0;

  for (const invoice of invoices) {
    if (invoice.status === "void") continue;
    if (invoice.status === "draft") {
      draftCount += 1;
      continue;
    }
    const balance = computeInvoiceBalance(Number(invoice.total_amount), computeActivePaymentsTotal(invoice.payments));
    if (balance <= 0) continue;
    outstandingTotal += balance;
    if (invoice.due_date && daysUntil(invoice.due_date, now) < 0) {
      overdueCount += 1;
      overdueTotal += balance;
    }
  }

  return {
    outstandingTotal: Math.round(outstandingTotal * 100) / 100,
    overdueCount,
    overdueTotal: Math.round(overdueTotal * 100) / 100,
    draftCount,
    currency: invoices[0]?.currency ?? "ETB",
  };
}
