"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LOCALES, LOCALE_COOKIE, LOCALE_NAMES, type Locale } from "@/i18n/config";
import { useI18n } from "@/i18n/client";

export function LanguageSwitcher() {
  const { locale, dict } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function change(next: Locale) {
    if (next === locale) return;
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => router.refresh());
  }

  return (
    <div
      role="group"
      aria-label={dict.common.language}
      className={`flex overflow-hidden rounded-md border border-stone-300 text-xs ${pending ? "opacity-60" : ""}`}
    >
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          title={LOCALE_NAMES[l]}
          aria-pressed={l === locale}
          onClick={() => change(l)}
          className={`px-2 py-1 font-medium ${
            l === locale ? "bg-green-700 text-white" : "bg-white text-stone-700 hover:bg-stone-100"
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
