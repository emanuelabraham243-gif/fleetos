"use client";

import { Wallet } from "lucide-react";
import { useMemo, useState } from "react";

import { CreateInvoiceDialog } from "@/components/payments/create-invoice-dialog";
import { InvoiceStatusDialog } from "@/components/payments/invoice-status-dialog";
import { RecordPaymentDialog } from "@/components/payments/record-payment-dialog";
import { VoidPaymentDialog } from "@/components/payments/void-payment-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { InvoiceListItem } from "@/lib/data/invoices";
import type { PaymentListItem } from "@/lib/data/payments";
import type { InvoiceSummary } from "@/lib/domain/invoice";
import {
  computeActivePaymentsTotal,
  computeInvoiceBalance,
  computeInvoiceDisplayStatus,
  type InvoiceDisplayStatus,
  type StoredInvoiceStatus,
} from "@/lib/domain/invoice";
import type { PaymentsSummary } from "@/lib/domain/payment";
import { INVOICE_DISPLAY_STATUS_LABEL, PAYMENT_METHOD_LABEL } from "@/lib/i18n/labels";
import { formatCurrency } from "@/lib/format-currency";
import { formatDate } from "@/lib/format-time";

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1">
        <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</span>
        <span className="text-2xl font-semibold tabular-nums">{value}</span>
      </CardContent>
    </Card>
  );
}

const STATUS_BADGE_VARIANT: Record<InvoiceDisplayStatus, "default" | "secondary" | "destructive" | "outline"> = {
  DRAFT: "outline",
  SENT: "secondary",
  OVERDUE: "destructive",
  PAID: "default",
  VOID: "destructive",
};

export function PaymentsExplorer({
  invoices,
  invoiceSummary,
  payments,
  paymentsSummary,
  clients,
  canManage,
}: {
  invoices: InvoiceListItem[];
  invoiceSummary: InvoiceSummary;
  payments: PaymentListItem[];
  paymentsSummary: PaymentsSummary;
  clients: { id: string; name: string }[];
  canManage: boolean;
}) {
  const [clientFilter, setClientFilter] = useState("");

  const filteredInvoices = useMemo(
    () => (clientFilter ? invoices.filter((i) => i.client_id === clientFilter) : invoices),
    [invoices, clientFilter],
  );

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <SummaryCard label="Outstanding" value={formatCurrency(invoiceSummary.outstandingTotal, invoiceSummary.currency)} />
        <SummaryCard
          label="Overdue"
          value={`${invoiceSummary.overdueCount} (${formatCurrency(invoiceSummary.overdueTotal, invoiceSummary.currency)})`}
        />
        <SummaryCard label="Draft Invoices" value={String(invoiceSummary.draftCount)} />
        <SummaryCard
          label="Paid This Month"
          value={
            paymentsSummary.paidThisMonthCount > 0
              ? formatCurrency(paymentsSummary.paidThisMonthTotal, paymentsSummary.currency)
              : "No data yet"
          }
        />
      </div>

      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold tracking-tight">Invoices</h2>
          <div className="flex items-center gap-2">
            <select
              aria-label="Client"
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="border-input bg-background h-9 rounded-md border px-2 text-sm shadow-xs"
            >
              <option value="">All clients</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {canManage ? <CreateInvoiceDialog clients={clients} /> : null}
          </div>
        </div>

        {filteredInvoices.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <Wallet className="text-muted-foreground size-8" />
              <p className="text-muted-foreground max-w-sm text-sm">
                {invoices.length === 0 ? "No invoices yet." : "No invoices match this filter."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Issued</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                  {canManage ? <TableHead className="w-56" aria-label="Actions" /> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => {
                  const balance = computeInvoiceBalance(
                    Number(invoice.total_amount),
                    computeActivePaymentsTotal(invoice.payments),
                  );
                  const displayStatus = computeInvoiceDisplayStatus(
                    invoice.status as StoredInvoiceStatus,
                    balance,
                    invoice.due_date,
                  );
                  return (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                      <TableCell>{invoice.client?.name ?? "—"}</TableCell>
                      <TableCell className="text-xs">{formatDate(invoice.issue_date)}</TableCell>
                      <TableCell className="text-xs">{invoice.due_date ? formatDate(invoice.due_date) : "—"}</TableCell>
                      <TableCell>{formatCurrency(Number(invoice.total_amount), invoice.currency)}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(balance, invoice.currency)}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_BADGE_VARIANT[displayStatus]}>
                          {INVOICE_DISPLAY_STATUS_LABEL[displayStatus]}
                        </Badge>
                      </TableCell>
                      {canManage ? (
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {displayStatus === "DRAFT" ? (
                              <>
                                <InvoiceStatusDialog invoiceId={invoice.id} invoiceNumber={invoice.invoice_number} action="send" />
                                <InvoiceStatusDialog invoiceId={invoice.id} invoiceNumber={invoice.invoice_number} action="void" />
                              </>
                            ) : null}
                            {(displayStatus === "SENT" || displayStatus === "OVERDUE") && balance > 0 ? (
                              <RecordPaymentDialog
                                invoiceId={invoice.id}
                                invoiceNumber={invoice.invoice_number}
                                balance={balance}
                                currency={invoice.currency}
                              />
                            ) : null}
                          </div>
                        </TableCell>
                      ) : null}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold tracking-tight">Payments Received</h2>
        {payments.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="text-muted-foreground py-10 text-center text-sm">
              No payments recorded yet.
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Recorded By</TableHead>
                  {canManage ? <TableHead className="w-24" aria-label="Actions" /> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="text-xs">{formatDate(payment.paid_at)}</TableCell>
                    <TableCell>{payment.client?.name ?? "—"}</TableCell>
                    <TableCell>{payment.invoice?.invoice_number ?? "—"}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(Number(payment.amount), payment.currency)}</TableCell>
                    <TableCell>{PAYMENT_METHOD_LABEL[payment.method]}</TableCell>
                    <TableCell>{payment.reference ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={payment.status === "active" ? "outline" : "destructive"}>
                        {payment.status === "active" ? "Active" : "Voided"}
                      </Badge>
                    </TableCell>
                    <TableCell>{payment.recorded_by_profile?.full_name ?? "—"}</TableCell>
                    {canManage ? (
                      <TableCell>{payment.status === "active" ? <VoidPaymentDialog paymentId={payment.id} /> : null}</TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </div>
  );
}
