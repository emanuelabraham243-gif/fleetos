"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { getCurrentProfile } from "@/lib/data/profile";
import { canManageFleet } from "@/lib/domain/permissions";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

/** Permissive on purpose -- an Ethiopian mobile number, a landline, a "+" country code, spaces or hyphens all pass; this only rejects obvious garbage. */
const PHONE_PATTERN = /^[+\d][\d\s-]{6,}$/;

function readDriverFields(formData: FormData) {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const employeeId = String(formData.get("employee_id") ?? "").trim();
  const licenseNumber = String(formData.get("license_number") ?? "").trim();
  const licenseClass = String(formData.get("license_class") ?? "").trim();
  const licenseIssuedAt = String(formData.get("license_issued_at") ?? "").trim();
  const licenseExpiry = String(formData.get("license_expiry") ?? "").trim();
  const hireDate = String(formData.get("hire_date") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const status = String(formData.get("status") ?? "ACTIVE") as Database["public"]["Enums"]["driver_status"];

  return {
    fullName,
    phone,
    employeeId,
    licenseNumber,
    licenseClass,
    licenseIssuedAt,
    licenseExpiry,
    hireDate,
    email,
    notes,
    status,
  };
}

function validateDriverFields(fields: ReturnType<typeof readDriverFields>): string | null {
  if (!fields.fullName) return "Full name is required.";
  if (fields.phone && !PHONE_PATTERN.test(fields.phone)) {
    return "Phone number doesn't look valid -- use digits, spaces, or a leading +.";
  }
  if (fields.licenseIssuedAt && fields.licenseExpiry && fields.licenseIssuedAt > fields.licenseExpiry) {
    return "License expiry must be after the license issue date.";
  }
  return null;
}

export type CreateDriverState = { error: string } | null;

export async function createDriver(
  _prevState: CreateDriverState,
  formData: FormData,
): Promise<CreateDriverState> {
  const profile = await getCurrentProfile();
  if (!profile || !canManageFleet(profile.role)) {
    return { error: "You don't have permission to add drivers." };
  }

  const fields = readDriverFields(formData);
  const validationError = validateDriverFields(fields);
  if (validationError) return { error: validationError };

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("drivers")
    .insert({
      organization_id: profile.organization_id,
      full_name: fields.fullName,
      phone: fields.phone || null,
      email: fields.email || null,
      employee_id: fields.employeeId || null,
      license_number: fields.licenseNumber || null,
      license_class: fields.licenseClass || null,
      license_issued_at: fields.licenseIssuedAt || null,
      license_expiry: fields.licenseExpiry || null,
      hire_date: fields.hireDate || null,
      status: fields.status,
      notes: fields.notes || null,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        error: "A driver with this employee ID or license number already exists in your organization.",
      };
    }
    return { error: error.message };
  }

  revalidatePath("/drivers");
  redirect(`/drivers/${data.id}`);
}

export type UpdateDriverState = { error: string } | null;

/**
 * Critical fields (status, license number, phone) are already covered by
 * the Phase 1 `audit_changes` trigger on `drivers` -- every change here is
 * recorded with who/when/before/after automatically, nothing silently
 * overwrites what was there before.
 */
export async function updateDriver(
  driverId: string,
  _prevState: UpdateDriverState,
  formData: FormData,
): Promise<UpdateDriverState> {
  const profile = await getCurrentProfile();
  if (!profile || !canManageFleet(profile.role)) {
    return { error: "You don't have permission to edit drivers." };
  }

  const fields = readDriverFields(formData);
  const validationError = validateDriverFields(fields);
  if (validationError) return { error: validationError };

  const supabase = await createClient();

  const { error } = await supabase
    .from("drivers")
    .update({
      full_name: fields.fullName,
      phone: fields.phone || null,
      email: fields.email || null,
      employee_id: fields.employeeId || null,
      license_number: fields.licenseNumber || null,
      license_class: fields.licenseClass || null,
      license_issued_at: fields.licenseIssuedAt || null,
      license_expiry: fields.licenseExpiry || null,
      hire_date: fields.hireDate || null,
      status: fields.status,
      notes: fields.notes || null,
    })
    .eq("id", driverId);

  if (error) {
    if (error.code === "23505") {
      return {
        error: "Another driver in your organization already uses that employee ID or license number.",
      };
    }
    return { error: error.message };
  }

  revalidatePath("/drivers");
  revalidatePath(`/drivers/${driverId}`);
  redirect(`/drivers/${driverId}`);
}
