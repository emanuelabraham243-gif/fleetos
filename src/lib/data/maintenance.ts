import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

export type MaintenanceSchedule = Database["public"]["Tables"]["maintenance_schedules"]["Row"];
export type MaintenanceIssue = Database["public"]["Tables"]["maintenance_issues"]["Row"];
export type WorkOrder = Database["public"]["Tables"]["work_orders"]["Row"] & {
  vendor: Pick<Database["public"]["Tables"]["vendors"]["Row"], "id" | "name"> | null;
};

/**
 * The single next-due schedule per vehicle (soonest `next_due_at` among
 * active schedules), keyed by vehicle id. Powers the Vehicles list
 * "Next Maintenance" column and the fleet summary without re-querying per
 * row.
 */
export async function getUpcomingMaintenanceByVehicle(
  supabase: SupabaseClient<Database>,
): Promise<Map<string, MaintenanceSchedule>> {
  const { data, error } = await supabase
    .from("maintenance_schedules")
    .select("*")
    .eq("is_active", true)
    .not("next_due_at", "is", null)
    .order("next_due_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to load maintenance schedules: ${error.message}`);
  }

  const byVehicle = new Map<string, MaintenanceSchedule>();
  for (const schedule of data ?? []) {
    if (!byVehicle.has(schedule.vehicle_id)) {
      byVehicle.set(schedule.vehicle_id, schedule);
    }
  }
  return byVehicle;
}

export interface VehicleMaintenance {
  schedules: MaintenanceSchedule[];
  issues: MaintenanceIssue[];
  workOrders: WorkOrder[];
}

/** Everything the Maintenance tab shows for one vehicle. */
export async function getVehicleMaintenance(
  supabase: SupabaseClient<Database>,
  vehicleId: string,
): Promise<VehicleMaintenance> {
  const [schedulesRes, issuesRes, workOrdersRes] = await Promise.all([
    supabase
      .from("maintenance_schedules")
      .select("*")
      .eq("vehicle_id", vehicleId)
      .order("next_due_at", { ascending: true }),
    supabase
      .from("maintenance_issues")
      .select("*")
      .eq("vehicle_id", vehicleId)
      .order("reported_at", { ascending: false }),
    supabase
      .from("work_orders")
      .select("*, vendor:vendors(id, name)")
      .eq("vehicle_id", vehicleId)
      .order("opened_at", { ascending: false }),
  ]);

  if (schedulesRes.error) {
    throw new Error(`Failed to load maintenance schedules: ${schedulesRes.error.message}`);
  }
  if (issuesRes.error) {
    throw new Error(`Failed to load maintenance issues: ${issuesRes.error.message}`);
  }
  if (workOrdersRes.error) {
    throw new Error(`Failed to load work orders: ${workOrdersRes.error.message}`);
  }

  return {
    schedules: schedulesRes.data,
    issues: issuesRes.data,
    workOrders: workOrdersRes.data,
  };
}
