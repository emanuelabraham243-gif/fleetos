import { LayoutDashboard } from "lucide-react";

import { PagePlaceholder } from "@/components/page-placeholder";

export default function CommandCenterPage() {
  return (
    <PagePlaceholder
      icon={LayoutDashboard}
      title="Command Center"
      description="The live operational overview -- fleet map, dispatch board, and alert feed -- comes together once the operational modules underneath it exist."
    />
  );
}
