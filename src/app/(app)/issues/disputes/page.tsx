import { AlertTriangle } from "lucide-react";

import { PagePlaceholder } from "@/components/page-placeholder";

export default function DisputesPage() {
  return (
    <PagePlaceholder
      icon={AlertTriangle}
      title="Disputes"
      description="Disputes raised over deliveries, fuel, damage claims, or payments."
    />
  );
}
