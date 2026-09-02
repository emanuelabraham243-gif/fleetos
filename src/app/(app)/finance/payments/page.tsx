import { Wallet } from "lucide-react";

import { PagePlaceholder } from "@/components/page-placeholder";

export default function PaymentsPage() {
  return (
    <PagePlaceholder
      icon={Wallet}
      title="Payments"
      description="Payments received against invoices."
    />
  );
}
