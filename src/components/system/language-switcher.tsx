"use client";

import { useTransition } from "react";

import { setLocale } from "@/lib/actions/locale";
import type { Locale } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const [pending, startTransition] = useTransition();

  function choose(next: Locale) {
    if (next === locale) return;
    startTransition(() => {
      void setLocale(next);
    });
  }

  return (
    <div className="border-input inline-flex rounded-md border p-0.5 text-sm">
      <button
        type="button"
        disabled={pending}
        onClick={() => choose("en")}
        className={cn(
          "rounded-sm px-3 py-1",
          locale === "en" ? "bg-accent font-medium" : "text-muted-foreground",
        )}
      >
        EN
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => choose("am")}
        className={cn(
          "rounded-sm px-3 py-1",
          locale === "am" ? "bg-accent font-medium" : "text-muted-foreground",
        )}
      >
        አማ
      </button>
    </div>
  );
}
