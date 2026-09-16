import type { WORK_ORDER_SERVICE_CATEGORY_LABEL } from "@/lib/i18n/labels";

/**
 * Confirmed Amharic terminology only, sourced from the real paper documents
 * inspected from the truck folder (Section 1 of the FleetOS revised build
 * spec). Every key here is deliberately partial -- an unset key falls back
 * to the English value via getLabel(), so this file is safe to extend
 * incrementally as more terms are confirmed by the business owner/a fluent
 * translator, never guessed ahead of that confirmation.
 *
 * DIFFERENTIAL_GEARBOX_SERVICE below is a best-effort mapping of
 * የጋራጅ ሰርቪስ by elimination against the other 3 paper terms, not a
 * confirmed 1:1 translation -- flagged for business-owner confirmation
 * before this is treated as final.
 */
export const am: {
  WORK_ORDER_SERVICE_CATEGORY_LABEL?: Partial<typeof WORK_ORDER_SERVICE_CATEGORY_LABEL>;
} = {
  WORK_ORDER_SERVICE_CATEGORY_LABEL: {
    ENGINE_OIL_SERVICE: "የሞተር ዘይት ሰርቪስ",
    GARAGE_TIRE_AXLE_SERVICE: "የጋራዥ የጎማ ሰርቪስ",
    TIRE_PURCHASE_INSTALLATION: "የጉማ ግዢ እና አይነት",
    DIFFERENTIAL_GEARBOX_SERVICE: "የጋራጅ ሰርቪስ",
  },
};
