import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { getVehicleOdometerProvenance } from "@/lib/data/fuel";
import { isOpenIssueStatus } from "@/lib/domain/maintenance-issue";
import {
  computeMaintenanceDue,
  deriveScheduleRuleType,
  type MaintenanceDueResult,
  type MaintenanceScheduleRuleType,
} from "@/lib/domain/maintenance-schedule";
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

// ============================================================================
// /maintenance page: fleet-wide summary, dashboard sections, and the full
// schedules list -- everything below this line is new in Phase 7.
// ============================================================================

export type ScheduleVehicle = Pick<
  Database["public"]["Tables"]["vehicles"]["Row"],
  "id" | "unit_number" | "license_plate"
>;

export interface ScheduleWithDue {
  schedule: MaintenanceSchedule;
  vehicle: ScheduleVehicle;
  ruleType: MaintenanceScheduleRuleType | null;
  due: MaintenanceDueResult;
}

type ScheduleWithVehicleJoin = MaintenanceSchedule & { vehicle: ScheduleVehicle | null };

/**
 * Computes each schedule's current due state against its vehicle's own real
 * odometer provenance (Phase 6's `getVehicleOdometerProvenance` -- never GPS
 * mileage without provenance). Shared by every caller that needs due status
 * so they can never disagree about which vehicles are due.
 */
async function attachDueToSchedules(
  supabase: SupabaseClient<Database>,
  schedules: ScheduleWithVehicleJoin[],
): Promise<ScheduleWithDue[]> {
  const vehicleIds = Array.from(new Set(schedules.map((s) => s.vehicle_id)));
  const odometerByVehicle = new Map<string, number | null>(
    await Promise.all(
      vehicleIds.map(async (vehicleId): Promise<[string, number | null]> => {
        const provenance = await getVehicleOdometerProvenance(supabase, vehicleId);
        return [vehicleId, provenance.latest?.odometerKm ?? null];
      }),
    ),
  );

  return schedules
    .filter((s): s is ScheduleWithVehicleJoin & { vehicle: ScheduleVehicle } => s.vehicle !== null)
    .map((s) => ({
      schedule: s,
      vehicle: s.vehicle,
      ruleType: deriveScheduleRuleType(s),
      due: computeMaintenanceDue(s, odometerByVehicle.get(s.vehicle_id) ?? null),
    }));
}

/** Every active schedule's current due state -- the one shared query both the summary cards and the dashboard sections read from. */
export async function getScheduleDueList(supabase: SupabaseClient<Database>): Promise<ScheduleWithDue[]> {
  const { data: schedules, error } = await supabase
    .from("maintenance_schedules")
    .select("*, vehicle:vehicles(id, unit_number, license_plate)")
    .eq("is_active", true);

  if (error) {
    throw new Error(`Failed to load maintenance schedules: ${error.message}`);
  }
  return attachDueToSchedules(supabase, schedules ?? []);
}

export interface MaintenanceSummary {
  vehiclesDue: number;
  dueSoon: number;
  overdue: number;
  inMaintenance: number;
  openIssues: number;
  openWorkOrders: number;
}

/** Summary cards for `/maintenance`. A vehicle counts toward exactly one of due/dueSoon/overdue -- its single worst schedule, never double-counted across cards. */
export async function getMaintenanceSummary(supabase: SupabaseClient<Database>): Promise<MaintenanceSummary> {
  const [scheduleDue, vehiclesRes, issuesRes, workOrdersRes] = await Promise.all([
    getScheduleDueList(supabase),
    supabase.from("vehicles").select("id, status").is("archived_at", null),
    supabase.from("maintenance_issues").select("status"),
    supabase.from("work_orders").select("status"),
  ]);

  if (vehiclesRes.error) throw new Error(`Failed to load vehicles: ${vehiclesRes.error.message}`);
  if (issuesRes.error) throw new Error(`Failed to load maintenance issues: ${issuesRes.error.message}`);
  if (workOrdersRes.error) throw new Error(`Failed to load work orders: ${workOrdersRes.error.message}`);

  const worstByVehicle = new Map<string, "OVERDUE" | "DUE" | "DUE_SOON">();
  for (const { vehicle, due } of scheduleDue) {
    if (due.status !== "OVERDUE" && due.status !== "DUE" && due.status !== "DUE_SOON") continue;
    const current = worstByVehicle.get(vehicle.id);
    if (!current || due.status === "OVERDUE" || (due.status === "DUE" && current === "DUE_SOON")) {
      worstByVehicle.set(vehicle.id, due.status);
    }
  }

  let vehiclesDue = 0;
  let dueSoon = 0;
  let overdue = 0;
  for (const status of worstByVehicle.values()) {
    if (status === "OVERDUE") overdue += 1;
    else if (status === "DUE") vehiclesDue += 1;
    else dueSoon += 1;
  }

  return {
    vehiclesDue,
    dueSoon,
    overdue,
    inMaintenance: (vehiclesRes.data ?? []).filter((v) => v.status === "maintenance").length,
    openIssues: (issuesRes.data ?? []).filter((i) => isOpenIssueStatus(i.status)).length,
    openWorkOrders: (workOrdersRes.data ?? []).filter((w) => w.status !== "COMPLETED" && w.status !== "CANCELLED")
      .length,
  };
}

export type DashboardIssueItem = MaintenanceIssue & {
  vehicle: ScheduleVehicle | null;
  driver: Pick<Database["public"]["Tables"]["drivers"]["Row"], "id" | "full_name"> | null;
};

export type DashboardWorkOrderItem = WorkOrder & {
  vehicle: ScheduleVehicle | null;
};

export interface MaintenanceDashboard {
  dueSoon: ScheduleWithDue[];
  overdue: ScheduleWithDue[];
  openIssues: DashboardIssueItem[];
  openWorkOrders: DashboardWorkOrderItem[];
  vehiclesInMaintenance: (ScheduleVehicle & { status: Database["public"]["Enums"]["vehicle_status"] })[];
}

/** The `/maintenance` dashboard sections, newest/most-urgent first. */
export async function getMaintenanceDashboard(supabase: SupabaseClient<Database>): Promise<MaintenanceDashboard> {
  const [scheduleDue, issuesRes, workOrdersRes, vehiclesRes] = await Promise.all([
    getScheduleDueList(supabase),
    supabase
      .from("maintenance_issues")
      .select("*, vehicle:vehicles(id, unit_number, license_plate), driver:drivers(id, full_name)")
      .order("reported_at", { ascending: false }),
    supabase
      .from("work_orders")
      .select("*, vehicle:vehicles(id, unit_number, license_plate), vendor:vendors(id, name)")
      .order("opened_at", { ascending: false }),
    supabase
      .from("vehicles")
      .select("id, unit_number, license_plate, status")
      .eq("status", "maintenance")
      .is("archived_at", null),
  ]);

  if (issuesRes.error) throw new Error(`Failed to load maintenance issues: ${issuesRes.error.message}`);
  if (workOrdersRes.error) throw new Error(`Failed to load work orders: ${workOrdersRes.error.message}`);
  if (vehiclesRes.error) throw new Error(`Failed to load vehicles: ${vehiclesRes.error.message}`);

  const dueSoon = scheduleDue
    .filter((s) => s.due.status === "DUE_SOON" || s.due.status === "DUE")
    .sort((a, b) => (a.due.remainingKm ?? a.due.remainingDays ?? 0) - (b.due.remainingKm ?? b.due.remainingDays ?? 0));
  const overdue = scheduleDue.filter((s) => s.due.status === "OVERDUE");

  return {
    dueSoon,
    overdue,
    openIssues: (issuesRes.data ?? []).filter((i) => isOpenIssueStatus(i.status)),
    openWorkOrders: (workOrdersRes.data ?? []).filter((w) => w.status !== "COMPLETED" && w.status !== "CANCELLED"),
    vehiclesInMaintenance: vehiclesRes.data ?? [],
  };
}

/** The full `/maintenance/schedules` list -- active and inactive, every vehicle, each with its computed due state (inactive schedules come back CANCELLED). */
export async function getMaintenanceSchedulesList(supabase: SupabaseClient<Database>): Promise<ScheduleWithDue[]> {
  const { data, error } = await supabase
    .from("maintenance_schedules")
    .select("*, vehicle:vehicles(id, unit_number, license_plate)")
    .order("vehicle_id", { ascending: true });

  if (error) {
    throw new Error(`Failed to load maintenance schedules: ${error.message}`);
  }
  return attachDueToSchedules(supabase, data ?? []);
}

export interface VehicleDispatchWarning {
  vehicleStatus: Database["public"]["Enums"]["vehicle_status"];
  openCriticalIssues: { id: string; title: string }[];
}

/**
 * Whether dispatching this vehicle right now would run into a known
 * maintenance conflict -- its own status not being 'active', or an open
 * critical issue. Returns null when there's nothing to warn about. Never
 * blocks dispatch by itself and never cancels anything -- `createTrip`
 * surfaces this as a warning the dispatcher must explicitly acknowledge,
 * per the spec's "show it clearly, require an authorized decision" rule.
 */
export async function getVehicleDispatchWarning(
  supabase: SupabaseClient<Database>,
  vehicleId: string,
): Promise<VehicleDispatchWarning | null> {
  const [vehicleRes, issuesRes] = await Promise.all([
    supabase.from("vehicles").select("status").eq("id", vehicleId).maybeSingle(),
    supabase.from("maintenance_issues").select("id, title, status, severity").eq("vehicle_id", vehicleId),
  ]);

  if (vehicleRes.error) throw new Error(`Failed to load vehicle: ${vehicleRes.error.message}`);
  if (issuesRes.error) throw new Error(`Failed to load maintenance issues: ${issuesRes.error.message}`);
  if (!vehicleRes.data) return null;

  const openCriticalIssues = (issuesRes.data ?? []).filter(
    (i) => isOpenIssueStatus(i.status) && i.severity === "critical",
  );

  if (vehicleRes.data.status === "active" && openCriticalIssues.length === 0) return null;

  return {
    vehicleStatus: vehicleRes.data.status,
    openCriticalIssues: openCriticalIssues.map((i) => ({ id: i.id, title: i.title })),
  };
}

/** Single-schedule read for the Schedule Maintenance edit form. */
export async function getMaintenanceScheduleById(
  supabase: SupabaseClient<Database>,
  scheduleId: string,
): Promise<MaintenanceSchedule | null> {
  const { data, error } = await supabase
    .from("maintenance_schedules")
    .select("*")
    .eq("id", scheduleId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load maintenance schedule: ${error.message}`);
  }
  return data;
}
