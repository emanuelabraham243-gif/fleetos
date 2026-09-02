import { FileText } from "lucide-react";

import { PagePlaceholder } from "@/components/page-placeholder";

export default function DocumentsPage() {
  return (
    <PagePlaceholder
      icon={FileText}
      title="Documents"
      description="Vehicle and driver documents, with expiry tracking."
    />
  );
}
