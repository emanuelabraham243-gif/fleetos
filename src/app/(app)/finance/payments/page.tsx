import { PaymentsExplorer } from "@/components/payments/payments-explorer";
import { getClients } from "@/lib/data/clients";
import { getInvoicesList } from "@/lib/data/invoices";
import { getPaymentsList } from "@/lib/data/payments";
import { getCurrentProfile } from "@/lib/data/profile";
import { computeInvoiceSummary } from "@/lib/domain/invoice";
import { canManageFleet } from "@/lib/domain/permissions";
import { computePaymentsSummary } from "@/lib/domain/payment";
import { createClient } from "@/lib/supabase/server";

export default async function PaymentsPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const [invoices, payments, clients] = await Promise.all([
    getInvoicesList(supabase),
    getPaymentsList(supabase),
    getClients(supabase),
  ]);

  const canManage = profile ? canManageFleet(profile.role) : false;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Payments</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Invoices billed to clients and payments received against them.
        </p>
      </div>

      <PaymentsExplorer
        invoices={invoices}
        invoiceSummary={computeInvoiceSummary(invoices)}
        payments={payments}
        paymentsSummary={computePaymentsSummary(payments)}
        clients={clients.map((c) => ({ id: c.id, name: c.name }))}
        canManage={canManage}
      />
    </div>
  );
}
