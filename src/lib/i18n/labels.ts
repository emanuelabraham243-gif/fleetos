import type { TripStatus } from "@/lib/domain/trip";
import type { VehicleOperationalStatus } from "@/lib/domain/vehicle";
import type { Database } from "@/lib/supabase/database.types";

/**
 * English display strings for every language-neutral token introduced in
 * Phase 2. This is the one place a future Amharic (or any other) locale
 * plugs in -- add `src/lib/i18n/am.ts` with the same keys and a resolver
 * that picks a dictionary by locale. Business logic must never compare
 * against these strings; compare against the enum/token itself.
 */
export const TRIP_STATUS_LABEL: Record<TripStatus, string> = {
  DRAFT: "Draft",
  ASSIGNED: "Assigned",
  LOADING: "Loading",
  DISPATCHED: "Dispatched",
  IN_TRANSIT: "In Transit",
  ARRIVED: "Arrived",
  DELIVERED: "Delivered",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const VEHICLE_OPERATIONAL_STATUS_LABEL: Record<VehicleOperationalStatus, string> = {
  ON_TRIP: "On Trip",
  AVAILABLE: "Available",
  MAINTENANCE: "Maintenance",
  OFFLINE: "Offline",
};

type VehicleDocumentType = Database["public"]["Enums"]["document_type_vehicle"];

export const VEHICLE_DOCUMENT_TYPE_LABEL: Record<VehicleDocumentType, string> = {
  registration: "Registration",
  insurance: "Insurance",
  permit: "Permit",
  inspection_certificate: "Inspection certificate",
  title: "Title",
  other: "Document",
};
