import type { Locale } from "@/lib/i18n/locale";

/**
 * Resolves a label for the caller's locale, falling back to the English
 * dictionary whenever no Amharic value has been supplied yet -- a missing
 * translation degrades to a known-correct English string, never a guess.
 * Business logic must never compare against the resolved string; compare
 * against the enum/token itself, exactly as the English-only dictionaries
 * in labels.ts already require.
 */
export function getLabel<D extends Record<string, string>>(
  english: D,
  amharic: Partial<D> | undefined,
  key: keyof D,
  locale: Locale,
): string {
  if (locale === "am" && amharic?.[key]) return amharic[key]!;
  return english[key];
}
