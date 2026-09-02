import { ClipboardCheck } from "lucide-react";

import { PagePlaceholder } from "@/components/page-placeholder";

export default function InspectionsPage() {
  return (
    <PagePlaceholder
      icon={ClipboardCheck}
      title="Inspections"
      description="Pre-trip, post-trip, and periodic vehicle inspection records."
    />
  );
}
