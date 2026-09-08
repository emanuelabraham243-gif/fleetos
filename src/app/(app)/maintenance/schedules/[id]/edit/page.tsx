import { notFound } from "next/navigation";
import { Wrench } from "lucide-react";

import { PagePlaceholder } from "@/components/page-placeholder";
import { ScheduleForm } from "@/components/maintenance/schedule-form";
import { getMaintenanceScheduleById } from "@/lib/data/maintenance";
import { getCurrentProfile } from "@/lib/data/profile";
import { getVehicles } from "@/lib/data/vehicles";
import { canManageFleet } from "@/lib/domain/permissions";
import { createClient } from "@/lib/supabase/server";

import { updateMaintenanceSchedule } from "../../../actions";

export default async function EditMaintenanceSchedulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile || !canManageFleet(profile.role)) {
    return (
      <PagePlaceholder
        icon={Wrench}
        title="Edit Schedule"
        description="Your role doesn't have permission to edit maintenance schedules."
      />
    );
  }

  const supabase = await createClient();
  const [schedule, vehicles] = await Promise.all([getMaintenanceScheduleById(supabase, id), getVehicles(supabase)]);
  if (!schedule) {
    notFound();
  }

  const updateAction = updateMaintenanceSchedule.bind(null, id);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit Schedule</h1>
        <p className="text-muted-foreground mt-1 text-sm">{schedule.title}</p>
      </div>
      <ScheduleForm
        action={updateAction}
        vehicles={vehicles.map((v) => ({ id: v.id, unitNumber: v.unit_number }))}
        defaultValues={{
          vehicle_id: schedule.vehicle_id,
          title: schedule.title,
          interval_km: schedule.interval_km !== null ? String(schedule.interval_km) : "",
          interval_days: schedule.interval_days !== null ? String(schedule.interval_days) : "",
          last_done_at: schedule.last_done_at ? schedule.last_done_at.slice(0, 10) : "",
          last_done_odometer_km:
            schedule.last_done_odometer_km !== null ? String(schedule.last_done_odometer_km) : "",
          is_active: schedule.is_active,
          notes: schedule.notes ?? "",
        }}
        submitLabel="Save Changes"
      />
    </div>
  );
}
