import { Landmark } from "lucide-react";

import { PagePlaceholder } from "@/components/page-placeholder";

export default function RevenuePage() {
  return (
    <PagePlaceholder
      icon={Landmark}
      title="Revenue"
      description="Revenue recorded against clients, contracts, and trips."
    />
  );
}
