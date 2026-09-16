import "server-only";

import { cookies } from "next/headers";

export type Locale = "en" | "am";

const LOCALE_COOKIE_NAME = "fleetos_locale";

/** Reads the caller's chosen interface language. Defaults to English when the cookie is absent or unrecognized -- never guessed from anything else (Accept-Language, org data, etc). */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE_NAME)?.value;
  return value === "am" ? "am" : "en";
}

export { LOCALE_COOKIE_NAME };
