import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "./config";
import { dictionaries } from "./dictionaries";

/** Idioma: cookie elegida por el usuario > Accept-Language del navegador > español */
export async function getLocale(): Promise<Locale> {
  const fromCookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;

  const accept = (await headers()).get("accept-language") ?? "";
  const fromHeader = accept
    .split(",")
    .map((part) => part.trim().slice(0, 2).toLowerCase())
    .find(isLocale);
  return fromHeader ?? DEFAULT_LOCALE;
}

export async function getI18n() {
  const locale = await getLocale();
  return { locale, dict: dictionaries[locale] };
}
