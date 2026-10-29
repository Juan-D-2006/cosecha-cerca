export const LOCALES = ["es", "en", "fr"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "es";
export const LOCALE_COOKIE = "locale";

export const LOCALE_NAMES: Record<Locale, string> = { es: "Español", en: "English", fr: "Français" };
/** Locale de Intl para números, monedas y fechas */
export const INTL_LOCALE: Record<Locale, string> = { es: "es-PE", en: "en-US", fr: "fr-FR" };

export const isLocale = (value: unknown): value is Locale =>
  typeof value === "string" && (LOCALES as readonly string[]).includes(value);
