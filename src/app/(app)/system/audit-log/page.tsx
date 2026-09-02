import { ListChecks } from "lucide-react";

import { PagePlaceholder } from "@/components/page-placeholder";

export default function AuditLogPage() {
  return (
    <PagePlaceholder
      icon={ListChecks}
      title="Audit Log"
      description="Every change to a critical record, with who, when, and the previous value."
    />
  );
}
