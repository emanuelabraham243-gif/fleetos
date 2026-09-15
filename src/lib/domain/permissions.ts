import type { Database } from "@/lib/supabase/database.types";

export type OrgRole = Database["public"]["Enums"]["org_role"];

/**
 * Reuses the existing `org_role` enum from Phase 1 rather than a
 * separate permissions system. Owners, admins, and dispatchers can
 * change fleet data (add/edit vehicles, assign drivers); managers,
 * drivers, and viewers can only look. RLS still scopes every query to
 * the caller's organization regardless of role -- this is an
 * additional, app-layer check on top of that, not a replacement for it.
 */
const FLEET_MANAGEMENT_ROLES: readonly OrgRole[] = ["owner", "admin", "dispatcher"];

export function canManageFleet(role: OrgRole): boolean {
  return FLEET_MANAGEMENT_ROLES.includes(role);
}

/** Organization-level administration (Settings, Users, GPS connection config) -- narrower than fleet management, mirrors the DB's own `is_org_admin()`. */
const ORG_ADMIN_ROLES: readonly OrgRole[] = ["owner", "admin"];

export function canManageOrg(role: OrgRole): boolean {
  return ORG_ADMIN_ROLES.includes(role);
}
