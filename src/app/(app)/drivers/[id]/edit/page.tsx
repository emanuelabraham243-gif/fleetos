import { notFound } from "next/navigation";
import { Users } from "lucide-react";

import { PagePlaceholder } from "@/components/page-placeholder";
import { DriverForm } from "@/components/drivers/driver-form";
import { getDriverById } from "@/lib/data/drivers";
import { getCurrentProfile } from "@/lib/data/profile";
import { canManageFleet } from "@/lib/domain/permissions";
import { createClient } from "@/lib/supabase/server";

import { updateDriver } from "../../actions";

export default async function EditDriverPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getCurrentProfile();

  if (!profile || !canManageFleet(profile.role)) {
    return (
      <PagePlaceholder
        icon={Users}
        title="Edit Driver"
        description="Your role doesn't have permission to edit drivers."
      />
    );
  }

  const supabase = await createClient();
  const driver = await getDriverById(supabase, id);
  if (!driver) {
    notFound();
  }

  const boundAction = updateDriver.bind(null, driver.id);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit Driver</h1>
        <p className="text-muted-foreground mt-1 text-sm">{driver.full_name}</p>
      </div>
      <DriverForm
        action={boundAction}
        submitLabel="Save Changes"
        defaultValues={{
          full_name: driver.full_name,
          phone: driver.phone ?? "",
          email: driver.email ?? "",
          employee_id: driver.employee_id ?? "",
          license_number: driver.license_number ?? "",
          license_class: driver.license_class ?? "",
          license_issued_at: driver.license_issued_at ?? "",
          license_expiry: driver.license_expiry ?? "",
          hire_date: driver.hire_date ?? "",
          status: driver.status,
          notes: driver.notes ?? "",
        }}
      />
    </div>
  );
}
