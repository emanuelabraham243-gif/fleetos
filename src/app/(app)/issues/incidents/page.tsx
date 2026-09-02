import { ShieldAlert } from "lucide-react";

import { PagePlaceholder } from "@/components/page-placeholder";

export default function IncidentsPage() {
  return (
    <PagePlaceholder
      icon={ShieldAlert}
      title="Incidents"
      description="Recorded incidents, with evidence tagged as fact, calculation, input, interpretation, or decision."
    />
  );
}
