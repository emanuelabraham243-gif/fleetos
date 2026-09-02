import { BarChart3 } from "lucide-react";

import { PagePlaceholder } from "@/components/page-placeholder";

export default function AnalyticsPage() {
  return (
    <PagePlaceholder
      icon={BarChart3}
      title="Analytics"
      description="Trends and calculated anomalies across the fleet -- surfaced as evidence, not conclusions."
    />
  );
}
