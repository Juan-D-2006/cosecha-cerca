import type { Locale } from "../config";
import en from "./en";
import es, { type Dictionary } from "./es";
import fr from "./fr";

export type { Dictionary };
export const dictionaries: Record<Locale, Dictionary> = { es, en, fr };
