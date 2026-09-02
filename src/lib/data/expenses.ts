import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

export type VehicleExpense = Database["public"]["Tables"]["expenses"]["Row"] & {
  recorded_by_profile: Pick<Database["public"]["Tables"]["profiles"]["Row"], "id" | "full_name"> | null;
};

export async function getVehicleExpenses(
  supabase: SupabaseClient<Database>,
  vehicleId: string,
): Promise<VehicleExpense[]> {
  const { data, error } = await supabase
    .from("expenses")
    .select("*, recorded_by_profile:profiles!expenses_created_by_fkey(id, full_name)")
    .eq("vehicle_id", vehicleId)
    .order("occurred_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load expenses: ${error.message}`);
  }

  return data;
}
