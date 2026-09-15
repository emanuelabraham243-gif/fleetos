import { Users } from "lucide-react";

import { PagePlaceholder } from "@/components/page-placeholder";
import { UserRowActions } from "@/components/system/user-row-actions";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAllOrgProfiles, getCurrentProfile } from "@/lib/data/profile";
import { canManageOrg } from "@/lib/domain/permissions";
import { formatDate } from "@/lib/format-time";
import { ORG_ROLE_LABEL } from "@/lib/i18n/labels";
import { createClient } from "@/lib/supabase/server";

export default async function SystemUsersPage() {
  const profile = await getCurrentProfile();
  if (!profile || !canManageOrg(profile.role)) {
    return (
      <PagePlaceholder
        icon={Users}
        title="Users"
        description="Your role doesn't have permission to manage organization users."
      />
    );
  }

  const supabase = await createClient();
  const members = await getAllOrgProfiles(supabase);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage who has access to this organization and their role.
        </p>
      </div>

      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-56" aria-label="Actions" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">{m.full_name}</TableCell>
                <TableCell className="text-xs">{m.email}</TableCell>
                <TableCell>{ORG_ROLE_LABEL[m.role]}</TableCell>
                <TableCell>
                  <Badge variant={m.deactivated_at ? "destructive" : "default"}>
                    {m.deactivated_at ? "Deactivated" : "Active"}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs">{formatDate(m.created_at)}</TableCell>
                <TableCell>
                  <UserRowActions
                    userId={m.id}
                    role={m.role}
                    isDeactivated={m.deactivated_at !== null}
                    isSelf={m.id === profile.id}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
