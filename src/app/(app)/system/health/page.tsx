import { Activity } from "lucide-react";

import { PagePlaceholder } from "@/components/page-placeholder";

export default function SystemHealthPage() {
  return (
    <PagePlaceholder
      icon={Activity}
      title="System Health"
      description="GPS feed connectivity, sync status, and other operational health signals."
    />
  );
}
