import { Users } from "lucide-react";

import { PagePlaceholder } from "@/components/page-placeholder";
import { DriverForm } from "@/components/drivers/driver-form";
import { getCurrentProfile } from "@/lib/data/profile";
import { canManageFleet } from "@/lib/domain/permissions";

import { createDriver } from "../actions";

export default async function NewDriverPage() {
  const profile = await getCurrentProfile();

  if (!profile || !canManageFleet(profile.role)) {
    return (
      <PagePlaceholder
        icon={Users}
        title="Add Driver"
        description="Your role doesn't have permission to add drivers."
      />
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Add Driver</h1>
        <p className="text-muted-foreground mt-1 text-sm">Add a new driver to the roster.</p>
      </div>
      <DriverForm action={createDriver} submitLabel="Add Driver" />
    </div>
  );
}
