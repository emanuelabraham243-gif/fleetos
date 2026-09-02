import { daysUntil } from "@/lib/days-until";

export type DocumentStatus = "VALID" | "EXPIRING_SOON" | "EXPIRED" | "UNKNOWN";

const EXPIRING_SOON_WITHIN_DAYS = 30;

/** Same "don't claim confidence you don't have" spirit as GPS status -- a document with no expiry on file is UNKNOWN, never assumed valid. */
export function computeDocumentStatus(
  expiresAt: string | null | undefined,
  now: Date = new Date(),
): DocumentStatus {
  if (!expiresAt) return "UNKNOWN";
  const days = daysUntil(expiresAt, now);
  if (days < 0) return "EXPIRED";
  if (days <= EXPIRING_SOON_WITHIN_DAYS) return "EXPIRING_SOON";
  return "VALID";
}
