import { Users } from "lucide-react";

import { PagePlaceholder } from "@/components/page-placeholder";

export default function SystemUsersPage() {
  return (
    <PagePlaceholder
      icon={Users}
      title="Users"
      description="Manage who has access to this organization and their role."
    />
  );
}
