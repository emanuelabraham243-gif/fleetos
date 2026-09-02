import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { logout } from "@/app/login/actions";
import { AppShell } from "@/components/app-shell";
import { getCurrentProfile } from "@/lib/data/profile";
import { getUnreadNotificationCount } from "@/lib/data/notifications";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  const supabase = await createClient();
  const unreadNotificationCount = await getUnreadNotificationCount(supabase, profile.id);

  return (
    <AppShell
      organizationName={profile.organization.name}
      fullName={profile.full_name}
      role={profile.role}
      unreadNotificationCount={unreadNotificationCount}
      onSignOut={logout}
    >
      {children}
    </AppShell>
  );
}
