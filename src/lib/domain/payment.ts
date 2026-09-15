type PaymentLike = { amount: number | string; status: string; paid_at: string; currency: string };

export interface PaymentsSummary {
  paidThisMonthTotal: number;
  paidThisMonthCount: number;
  currency: string;
}

/** Pure combine over an already-fetched payments list, no query of its own -- mirrors computeInvoiceSummary. */
export function computePaymentsSummary(payments: PaymentLike[], now: Date = new Date()): PaymentsSummary {
  const monthStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
  const monthEnd = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1);

  const thisMonth = payments.filter((p) => {
    if (p.status !== "active") return false;
    const paidAt = new Date(p.paid_at).getTime();
    return paidAt >= monthStart && paidAt < monthEnd;
  });

  const paidThisMonthTotal = thisMonth.reduce((sum, p) => sum + Number(p.amount), 0);

  return {
    paidThisMonthTotal: Math.round(paidThisMonthTotal * 100) / 100,
    paidThisMonthCount: thisMonth.length,
    currency: payments[0]?.currency ?? "ETB",
  };
}
