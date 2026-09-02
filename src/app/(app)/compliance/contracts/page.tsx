import { FileStack } from "lucide-react";

import { PagePlaceholder } from "@/components/page-placeholder";

export default function ContractsPage() {
  return (
    <PagePlaceholder
      icon={FileStack}
      title="Contracts"
      description="Client contracts, rates, and their supporting documents."
    />
  );
}
