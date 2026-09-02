import { Bell } from "lucide-react";

import { PagePlaceholder } from "@/components/page-placeholder";

export default function AlertsPage() {
  return (
    <PagePlaceholder
      icon={Bell}
      title="Alerts"
      description="System-surfaced anomalies, such as a GPS feed going offline or a threshold being crossed."
    />
  );
}
