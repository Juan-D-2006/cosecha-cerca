import { INTL_LOCALE, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

/** Reemplaza {variables} en un texto traducido */
export function t(template: string, vars: Record<string, string | number> = {}) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? `{${key}}`));
}

export const formatPrice = (value: number, locale: Locale) =>
  new Intl.NumberFormat(INTL_LOCALE[locale], { style: "currency", currency: "PEN" }).format(value);

export const formatNumber = (value: number, locale: Locale) =>
  new Intl.NumberFormat(INTL_LOCALE[locale], { maximumFractionDigits: 2 }).format(value);

export const formatDateTime = (iso: string, locale: Locale) =>
  new Intl.DateTimeFormat(INTL_LOCALE[locale], { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(iso),
  );

/** "Vence en 5 h" / "Expires in 3 days" */
export function formatTimeLeft(iso: string, dict: Dictionary, now = Date.now()) {
  const hours = Math.max(0, Math.round((new Date(iso).getTime() - now) / 3_600_000));
  return hours < 48
    ? t(dict.common.hoursLeft, { n: hours })
    : t(dict.common.daysLeft, { n: Math.round(hours / 24) });
}

export const categoryName = (slug: string | null, fallback: string | null, dict: Dictionary) =>
  (slug && dict.common.categories[slug]) || fallback || dict.catalog.localProduct;
