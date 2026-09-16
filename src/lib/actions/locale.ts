"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { LOCALE_COOKIE_NAME, type Locale } from "@/lib/i18n/locale";

/** Sets the caller's interface language. No permission check -- every org member may switch their own display language. */
export async function setLocale(locale: Locale): Promise<void> {
  const store = await cookies();
  store.set(LOCALE_COOKIE_NAME, locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  revalidatePath("/", "layout");
}
