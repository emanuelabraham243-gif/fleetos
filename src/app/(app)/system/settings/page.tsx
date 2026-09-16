import { Settings } from "lucide-react";

import { PagePlaceholder } from "@/components/page-placeholder";
import { LanguageSwitcher } from "@/components/system/language-switcher";
import { OrgSettingsForm } from "@/components/system/org-settings-form";
import { getCurrentProfile } from "@/lib/data/profile";
import { canManageOrg } from "@/lib/domain/permissions";
import { getLocale } from "@/lib/i18n/locale";

export default async function SettingsPage() {
  const profile = await getCurrentProfile();
  if (!profile || !canManageOrg(profile.role)) {
    return (
      <PagePlaceholder
        icon={Settings}
        title="Settings"
        description="Your role doesn't have permission to view organization settings."
      />
    );
  }

  const locale = await getLocale();

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Organization profile, preferences, and configuration.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">Language</p>
        <LanguageSwitcher locale={locale} />
      </div>

      <OrgSettingsForm name={profile.organization.name} timezone={profile.organization.timezone} />
    </div>
  );
}
