import { Wrench } from "lucide-react";

import { PagePlaceholder } from "@/components/page-placeholder";

export default function MaintenancePage() {
  return (
    <PagePlaceholder
      icon={Wrench}
      title="Maintenance"
      description="Preventive schedules, reported issues, and work orders per vehicle."
    />
  );
}
