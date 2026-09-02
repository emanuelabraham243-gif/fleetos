import { Settings } from "lucide-react";

import { PagePlaceholder } from "@/components/page-placeholder";

export default function SettingsPage() {
  return (
    <PagePlaceholder
      icon={Settings}
      title="Settings"
      description="Organization profile, preferences, and configuration."
    />
  );
}
