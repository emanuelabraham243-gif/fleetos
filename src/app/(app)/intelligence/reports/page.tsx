import { ScrollText } from "lucide-react";

import { PagePlaceholder } from "@/components/page-placeholder";

export default function ReportsPage() {
  return (
    <PagePlaceholder
      icon={ScrollText}
      title="Reports"
      description="Generated operational and financial reports."
    />
  );
}
