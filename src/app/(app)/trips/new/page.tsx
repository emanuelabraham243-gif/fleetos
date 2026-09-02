import { Route } from "lucide-react";

import { PagePlaceholder } from "@/components/page-placeholder";

export default function NewTripPage() {
  return (
    <PagePlaceholder
      icon={Route}
      title="New Trip"
      description="The trip creation form isn't built yet."
    />
  );
}
