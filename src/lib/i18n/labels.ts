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
  repairs: "Repairs",
  insurance: "Insurance",
  permit: "Permit",
  toll: "Road/Toll",
  parking: "Parking",
  fine: "Fine",
  office: "Administrative",
  parts: "Parts",
  tires: "Tires",
  driver_related: "Driver",
  loading_unloading: "Loading/Unloading",
  accommodation: "Accommodation",
  meals: "Meals",
  communication: "Communication",
  other: "Other",
};

type PaymentMethod = Database["public"]["Enums"]["payment_method"];

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: "Cash",
  bank_transfer: "Bank Transfer",
  card: "Card",
  mobile_money: "Mobile Money",
  check: "Check",
  other: "Other",
};

type VendorCategory = Database["public"]["Enums"]["vendor_category"];

export const VENDOR_CATEGORY_LABEL: Record<VendorCategory, string> = {
  fuel_station: "Fuel Station",
  repair_shop: "Repair Shop",
  parts_supplier: "Parts Supplier",
  tire_supplier: "Tire Supplier",
  insurance: "Insurance Provider",
  other: "Other",
};

type ExpenseApprovalStatus = Database["public"]["Enums"]["expense_approval_status"];

export const EXPENSE_APPROVAL_STATUS_LABEL: Record<ExpenseApprovalStatus, string> = {
  RECORDED: "Recorded",
  PENDING_REVIEW: "Pending Review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
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

type MaintenanceIssueStatus = Database["public"]["Enums"]["maintenance_issue_status"];

export const MAINTENANCE_ISSUE_STATUS_LABEL: Record<MaintenanceIssueStatus, string> = {
  REPORTED: "Reported",
  ACKNOWLEDGED: "Acknowledged",
  UNDER_DIAGNOSIS: "Under Diagnosis",
  WORK_ORDER_CREATED: "Work Order Created",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
  DISMISSED: "Dismissed",
};

type MaintenanceIssueType = Database["public"]["Enums"]["maintenance_issue_type"];

export const MAINTENANCE_ISSUE_TYPE_LABEL: Record<MaintenanceIssueType, string> = {
  engine: "Engine",
  transmission: "Transmission",
  brakes: "Brakes",
  tires: "Tires",
  electrical: "Electrical",
  cooling: "Cooling",
  suspension: "Suspension",
  body: "Body",
  gps: "GPS",
  fuel_system: "Fuel System",
  other: "Other",
};

type MaintenanceIssueSeverity = Database["public"]["Enums"]["maintenance_issue_severity"];

export const MAINTENANCE_ISSUE_SEVERITY_LABEL: Record<MaintenanceIssueSeverity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

type WorkOrderStatus = Database["public"]["Enums"]["work_order_status"];

export const WORK_ORDER_STATUS_LABEL: Record<WorkOrderStatus, string> = {
  DRAFT: "Draft",
  APPROVED: "Approved",
  ASSIGNED: "Assigned",
  DIAGNOSIS: "Diagnosis",
  AWAITING_PARTS: "Awaiting Parts",
  IN_REPAIR: "In Repair",
  INSPECTION: "Inspection",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

type WorkOrderPriority = Database["public"]["Enums"]["work_order_priority"];

export const WORK_ORDER_PRIORITY_LABEL: Record<WorkOrderPriority, string> = {
  LOW: "Low",
  NORMAL: "Normal",
  HIGH: "High",
  CRITICAL: "Critical",
};

type MaintenanceType = Database["public"]["Enums"]["maintenance_type"];

export const MAINTENANCE_TYPE_LABEL: Record<MaintenanceType, string> = {
  PREVENTIVE: "Preventive",
  CORRECTIVE: "Corrective",
  INSPECTION: "Inspection",
  EMERGENCY: "Emergency",
};

type InspectionTypeEnum = Database["public"]["Enums"]["inspection_type"];

export const INSPECTION_TYPE_LABEL: Record<InspectionTypeEnum, string> = {
  pre_trip: "Pre-Trip",
  post_trip: "Post-Trip",
  routine: "Routine",
  maintenance: "Maintenance",
  safety: "Safety",
  damage: "Damage",
  return_to_service: "Return-to-Service",
};

type InspectionOverallResult = Database["public"]["Enums"]["inspection_overall_result"];

export const INSPECTION_OVERALL_RESULT_LABEL: Record<InspectionOverallResult, string> = {
  PASSED: "Passed",
  FAILED: "Failed",
  PARTIAL: "Partial",
  UNKNOWN: "Unknown",
};

type InspectionItemResult = Database["public"]["Enums"]["inspection_item_result"];

export const INSPECTION_ITEM_RESULT_LABEL: Record<InspectionItemResult, string> = {
  PASS: "Pass",
  FAIL: "Fail",
  NOT_APPLICABLE: "N/A",
  UNKNOWN: "Unknown",
};
