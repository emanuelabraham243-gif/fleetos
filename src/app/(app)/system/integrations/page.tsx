import { Cable } from "lucide-react";

import { PagePlaceholder } from "@/components/page-placeholder";

export default function IntegrationsPage() {
  return (
    <PagePlaceholder
      icon={Cable}
      title="Integrations"
      description="GPS provider connections and other external integrations."
    />
  );
}
