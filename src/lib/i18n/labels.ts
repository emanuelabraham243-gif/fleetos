import type { TripStatus } from "@/lib/domain/trip";
import type { DeliveryStatus } from "@/lib/domain/delivery";
import type { DocumentStatus } from "@/lib/domain/document";
import type { DriverOperationalState, DriverStatus } from "@/lib/domain/driver";
import type { TripStopStatus, TripStopType } from "@/lib/domain/trip-stop";
import type { VehicleListStatus, VehicleOperationalStatus } from "@/lib/domain/vehicle";
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

export const DELIVERY_STATUS_LABEL: Record<DeliveryStatus, string> = {
  PENDING: "Pending",
  IN_TRANSIT: "In Transit",
  ARRIVED: "Arrived",
  DELIVERED: "Delivered",
  PARTIALLY_DELIVERED: "Partially Delivered",
  REFUSED: "Refused",
  DAMAGED: "Damaged",
  CANCELLED: "Cancelled",
};

export const TRIP_STOP_STATUS_LABEL: Record<TripStopStatus, string> = {
  PLANNED: "Planned",
  ARRIVED: "Arrived",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  SKIPPED: "Skipped",
};

export const TRIP_STOP_TYPE_LABEL: Record<TripStopType, string> = {
  pickup: "Pickup",
  dropoff: "Drop-off",
  fuel: "Fuel stop",
  rest: "Rest stop",
  other: "Other",
};

export const VEHICLE_OPERATIONAL_STATUS_LABEL: Record<VehicleOperationalStatus, string> = {
  ON_TRIP: "On Trip",
  AVAILABLE: "Available",
  MAINTENANCE: "Maintenance",
  OFFLINE: "Offline",
};

export const VEHICLE_LIST_STATUS_LABEL: Record<VehicleListStatus, string> = {
  ...VEHICLE_OPERATIONAL_STATUS_LABEL,
  IDLE: "Idle",
  INACTIVE: "Inactive",
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

export const DOCUMENT_STATUS_LABEL: Record<DocumentStatus, string> = {
  VALID: "Valid",
  EXPIRING_SOON: "Expiring Soon",
  EXPIRED: "Expired",
  UNKNOWN: "Unknown",
};

type DriverDocumentType = Database["public"]["Enums"]["document_type_driver"];

export const DRIVER_DOCUMENT_TYPE_LABEL: Record<DriverDocumentType, string> = {
  license: "Driving License",
  medical_card: "Medical/Fitness Certificate",
  background_check: "Background Check",
  training_certificate: "Training Certificate",
  other: "Document",
};

export const DRIVER_STATUS_LABEL: Record<DriverStatus, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  ON_LEAVE: "On Leave",
  SUSPENDED: "Suspended",
  TERMINATED: "Terminated",
};

export const DRIVER_OPERATIONAL_STATE_LABEL: Record<DriverOperationalState, string> = {
  AVAILABLE: "Available",
  ON_TRIP: "On Trip",
  LOADING: "Loading",
  ARRIVED: "Arrived",
  OFF_DUTY: "Off Duty",
  ON_LEAVE: "On Leave",
  INACTIVE: "Inactive",
  UNKNOWN: "Unknown",
};

type ExpenseCategory = Database["public"]["Enums"]["expense_category"];

export const EXPENSE_CATEGORY_LABEL: Record<ExpenseCategory, string> = {
  maintenance: "Maintenance",
  insurance: "Insurance",
  permit: "Permit",
  toll: "Toll",
  parking: "Parking",
  fine: "Fine",
  office: "Office",
  parts: "Parts",
  tires: "Tires",
  driver_related: "Driver-related",
  other: "Other",
};

type IncidentType = Database["public"]["Enums"]["incident_type"];

export const INCIDENT_TYPE_LABEL: Record<IncidentType, string> = {
  accident: "Accident",
  traffic_violation: "Traffic violation",
  mechanical: "Mechanical problem",
  cargo_damage: "Cargo issue",
  safety: "Safety",
  other: "Operational incident",
};

type IncidentSeverity = Database["public"]["Enums"]["incident_severity"];

export const INCIDENT_SEVERITY_LABEL: Record<IncidentSeverity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

type IncidentStatus = Database["public"]["Enums"]["incident_status"];

export const INCIDENT_STATUS_LABEL: Record<IncidentStatus, string> = {
  open: "Open",
  investigating: "Investigating",
  resolved: "Resolved",
  closed: "Closed",
};
