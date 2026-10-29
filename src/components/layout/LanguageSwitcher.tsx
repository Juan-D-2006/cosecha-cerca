"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LOCALES, LOCALE_COOKIE, LOCALE_NAMES, type Locale } from "@/i18n/config";
import { useI18n } from "@/i18n/client";

/** Selector segmentado; la píldora se desliza al idioma elegido. */
export function LanguageSwitcher() {
  const { locale, dict } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const index = LOCALES.indexOf(locale);

  function change(next: Locale) {
    if (next === locale) return;
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => router.refresh());
  }

  return (
    <div
      role="group"
      aria-label={dict.common.language}
      className={`relative grid shrink-0 grid-cols-3 rounded-full border border-stone-300 bg-white p-0.5 text-xs font-semibold ${pending ? "opacity-70" : ""}`}
    >
      <span
        aria-hidden
        className="absolute inset-y-0.5 left-0.5 w-[calc((100%-4px)/3)] rounded-full bg-clay-500 shadow-sm transition-transform duration-300 ease-[var(--ease-out-expo)]"
        style={{ transform: `translateX(${index * 100}%)` }}
      />
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          title={LOCALE_NAMES[l]}
          aria-pressed={l === locale}
          onClick={() => change(l)}
          className={`relative z-10 rounded-full px-2.5 py-1 transition-colors duration-200 ${
            l === locale ? "text-stone-50" : "text-stone-600 hover:text-stone-900"
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
