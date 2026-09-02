import { Route } from "lucide-react";

import { PagePlaceholder } from "@/components/page-placeholder";

export default function TripsPage() {
  return (
    <PagePlaceholder
      icon={Route}
      title="Trips"
      description="Plan, schedule, and track trips from origin to final stop."
    />
  );
}
