"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LocateFixed, Recycle, Search } from "lucide-react";
import type { Category } from "@/types/domain";
import { useI18n } from "@/i18n/client";
import { categoryName } from "@/lib/format";
import { categoryIcon } from "@/lib/categoryIcons";
import { chipCls, chipOff, chipOn } from "@/components/ui";

const RADII = [5, 10, 25, 50, 100];

/** Actualiza la query string del catálogo conservando los demás filtros */
function useCatalogParams() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  function apply(updates: Record<string, string | null>) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
    }
    router.push(`${pathname}?${next.toString()}`, { scroll: false });
  }
  return { params, apply };
}

/** Buscador grande sobre la portada + botón de ubicación */
export function CatalogSearch() {
  const { dict } = useI18n();
  const c = dict.catalog;
  const { params, apply } = useCatalogParams();
  const [locating, setLocating] = useState(false);
  const usingMyLocation = params.has("lat") && params.has("lng");

  function useMyLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocating(false);
        apply({ lat: coords.latitude.toFixed(5), lng: coords.longitude.toFixed(5) });
      },
      () => setLocating(false),
      { enableHighAccuracy: false, timeout: 10_000 },
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <form
        role="search"
        className="flex flex-1 items-center gap-2 rounded-full bg-stone-50 p-1.5 pl-4 shadow-[0_10px_30px_-12px_rgb(0_0_0/0.5)]"
        onSubmit={(e) => {
          e.preventDefault();
          const q = new FormData(e.currentTarget).get("q");
          apply({ q: typeof q === "string" ? q.trim() : null });
        }}
      >
        <Search className="h-5 w-5 shrink-0 text-stone-500" aria-hidden />
        <label className="sr-only" htmlFor="catalog-q">{c.search}</label>
        <input
          id="catalog-q"
          name="q"
          defaultValue={params.get("q") ?? ""}
          placeholder={c.searchPlaceholder}
          className="min-w-0 flex-1 bg-transparent py-2 text-base text-stone-900 placeholder:text-stone-500 focus:outline-none"
        />
        <button className="rounded-full bg-clay-500 px-5 py-2.5 text-sm font-semibold text-stone-50 transition-[background-color,transform] duration-150 hover:bg-clay-600 active:scale-[0.97]">
          {c.search}
        </button>
      </form>
      <button
        type="button"
        onClick={useMyLocation}
        disabled={locating}
        className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-50/40 bg-stone-50/10 px-5 py-3 text-sm font-semibold text-stone-50 backdrop-blur transition-[background-color,transform] duration-150 hover:bg-stone-50/20 active:scale-[0.97] disabled:opacity-60"
      >
        <LocateFixed className={`h-4 w-4 ${locating ? "animate-spin" : ""}`} aria-hidden />
        {locating ? c.locating : usingMyLocation ? c.updateLocation : c.useLocation}
      </button>
    </div>
  );
}

/** Categorías como chips con ícono, radio y excedentes */
export function CatalogFilters({ categories }: { categories: Category[] }) {
  const { dict } = useI18n();
  const c = dict.catalog;
  const { params, apply } = useCatalogParams();
  const current = params.get("category") ?? "";
  const radius = params.get("radius") ?? "50";
  const surplus = params.get("surplus") === "1";
  const AllIcon = categoryIcon(null);

  return (
    <div className="space-y-3">
      <div
        role="group"
        aria-label={c.category}
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0"
      >
        <button type="button" aria-pressed={!current} onClick={() => apply({ category: null })} className={`${chipCls} ${!current ? chipOn : chipOff}`}>
          <AllIcon className="h-4 w-4" aria-hidden />
          {c.all}
        </button>
        {categories.map((cat) => {
          const Icon = categoryIcon(cat.slug);
          const on = current === cat.slug;
          return (
            <button
              key={cat.slug}
              type="button"
              aria-pressed={on}
              onClick={() => apply({ category: on ? null : cat.slug })}
              className={`${chipCls} ${on ? chipOn : chipOff}`}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {categoryName(cat.slug, cat.name, dict)}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div role="group" aria-label={c.radius} className="flex items-center gap-1 rounded-full border border-stone-300 bg-white p-1 text-sm">
          <span className="px-2 text-stone-600">{c.radius}</span>
          {RADII.map((r) => {
            const on = radius === String(r);
            return (
              <button
                key={r}
                type="button"
                aria-pressed={on}
                onClick={() => apply({ radius: String(r) })}
                className={`tabular rounded-full px-2.5 py-1 font-medium transition-colors duration-150 ${
                  on ? "bg-stone-900 text-stone-50" : "text-stone-700 hover:bg-stone-100"
                }`}
              >
                {r} km
              </button>
            );
          })}
        </div>
        <button
          type="button"
          aria-pressed={surplus}
          onClick={() => apply({ surplus: surplus ? null : "1" })}
          className={`${chipCls} ${
            surplus ? "border-amber-500 bg-amber-400 text-stone-900" : "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
          }`}
        >
          <Recycle className="h-4 w-4" aria-hidden />
          {c.surplusOnly}
        </button>
      </div>
    </div>
  );
}
