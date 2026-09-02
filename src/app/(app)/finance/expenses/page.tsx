import { Receipt } from "lucide-react";

import { PagePlaceholder } from "@/components/page-placeholder";

export default function ExpensesPage() {
  return (
    <PagePlaceholder
      icon={Receipt}
      title="Expenses"
      description="Operating expenses by vehicle, driver, and category."
    />
  );
}
