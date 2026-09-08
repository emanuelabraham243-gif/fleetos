import type { Database } from "@/lib/supabase/database.types";

export type InspectionType = Database["public"]["Enums"]["inspection_type"];
export type InspectionOverallResult = Database["public"]["Enums"]["inspection_overall_result"];
export type InspectionItemResult = Database["public"]["Enums"]["inspection_item_result"];

export interface InspectionItemLike {
  result: InspectionItemResult;
}

/**
 * The overall result is always derived from the checklist items, never
 * entered independently -- so it can't say PASSED while a failed item sits
 * underneath it. NOT_APPLICABLE items don't count either way. UNKNOWN
 * items count: a form nobody actually checked is not the same fact as one
 * that passed, so a mix of PASS and UNKNOWN is PARTIAL, not PASSED.
 */
export function deriveOverallResult(items: InspectionItemLike[]): InspectionOverallResult {
  const relevant = items.filter((item) => item.result !== "NOT_APPLICABLE");
  if (relevant.length === 0) return "UNKNOWN";

  const hasFail = relevant.some((item) => item.result === "FAIL");
  if (hasFail) {
    return relevant.every((item) => item.result === "FAIL") ? "FAILED" : "PARTIAL";
  }

  const hasUnknown = relevant.some((item) => item.result === "UNKNOWN");
  if (hasUnknown) {
    return relevant.every((item) => item.result === "UNKNOWN") ? "UNKNOWN" : "PARTIAL";
  }

  return "PASSED";
}

export interface ChecklistItemTemplate {
  category: string;
  items: string[];
}

/**
 * The default checklist per inspection type -- lives in code, not a schema
 * table, since nothing yet needs it to be end-user editable (the spec asks
 * for the checklist to be "configurable later", not now). Types share
 * categories where it makes sense, but the item list genuinely differs:
 * a damage inspection has no reason to check GPS, a safety inspection has
 * no reason to check the spare tire.
 */
export const DEFAULT_CHECKLISTS: Record<InspectionType, ChecklistItemTemplate[]> = {
  pre_trip: [
    { category: "ENGINE", items: ["Oil level", "Coolant", "Leaks"] },
    { category: "TIRES", items: ["Front left", "Front right", "Rear tires", "Spare"] },
    { category: "BRAKES", items: ["Brake response", "Warning indicators"] },
    { category: "LIGHTS", items: ["Headlights", "Brake lights", "Indicators"] },
    { category: "BODY", items: ["Visible damage", "Mirrors", "Windshield"] },
    { category: "GPS", items: ["Device operational"] },
  ],
  post_trip: [
    { category: "ENGINE", items: ["Temperature warning", "Leaks"] },
    { category: "TIRES", items: ["Front left", "Front right", "Rear tires"] },
    { category: "BRAKES", items: ["Brake response"] },
    { category: "LIGHTS", items: ["Headlights", "Brake lights"] },
    { category: "BODY", items: ["Visible damage"] },
  ],
  routine: [
    { category: "ENGINE", items: ["Oil level", "Coolant", "Leaks", "Temperature warning"] },
    { category: "TIRES", items: ["Front left", "Front right", "Rear tires", "Spare"] },
    { category: "BRAKES", items: ["Brake response", "Warning indicators"] },
    { category: "LIGHTS", items: ["Headlights", "Brake lights", "Indicators"] },
    { category: "BODY", items: ["Visible damage", "Mirrors", "Windshield"] },
    { category: "GPS", items: ["Device operational"] },
  ],
  maintenance: [
    { category: "ENGINE", items: ["Oil level", "Coolant", "Leaks", "Temperature warning"] },
    { category: "BRAKES", items: ["Brake response", "Warning indicators"] },
    { category: "TIRES", items: ["Front left", "Front right", "Rear tires", "Spare"] },
    { category: "SUSPENSION", items: ["Visible wear", "Unusual noise"] },
  ],
  safety: [
    { category: "BRAKES", items: ["Brake response", "Warning indicators"] },
    { category: "LIGHTS", items: ["Headlights", "Brake lights", "Indicators"] },
    { category: "TIRES", items: ["Front left", "Front right", "Rear tires", "Spare"] },
    { category: "BODY", items: ["Mirrors", "Windshield"] },
  ],
  damage: [
    { category: "BODY", items: ["Visible damage", "Mirrors", "Windshield"] },
    { category: "TIRES", items: ["Front left", "Front right", "Rear tires"] },
  ],
  return_to_service: [
    { category: "ENGINE", items: ["Oil level", "Coolant", "Leaks", "Temperature warning"] },
    { category: "TIRES", items: ["Front left", "Front right", "Rear tires", "Spare"] },
    { category: "BRAKES", items: ["Brake response", "Warning indicators"] },
    { category: "LIGHTS", items: ["Headlights", "Brake lights", "Indicators"] },
    { category: "BODY", items: ["Visible damage", "Mirrors", "Windshield"] },
    { category: "GPS", items: ["Device operational"] },
  ],
};
