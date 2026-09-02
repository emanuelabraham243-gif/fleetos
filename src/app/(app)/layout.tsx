import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { logout } from "@/app/login/actions";
import { AppShell } from "@/components/app-shell";
import { getCurrentProfile } from "@/lib/data/profile";

export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  return (
    <AppShell
      organizationName={profile.organization.name}
      fullName={profile.full_name}
      role={profile.role}
      onSignOut={logout}
    >
      {children}
    </AppShell>
  );
}
