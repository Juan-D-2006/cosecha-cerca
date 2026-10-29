"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Category } from "@/types/domain";
import { useI18n } from "@/i18n/client";
import { categoryName } from "@/lib/format";

const RADII = [5, 10, 25, 50, 100];

export function CatalogFilters({ categories }: { categories: Category[] }) {
  const { dict } = useI18n();
  const c = dict.catalog;
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [locating, setLocating] = useState(false);
  const usingMyLocation = params.has("lat") && params.has("lng");

  function apply(updates: Record<string, string | null>) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
    }
    router.push(`${pathname}?${next.toString()}`);
  }

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
    <form
      className="flex flex-wrap items-end gap-3 rounded-lg border border-stone-200 bg-white p-4"
      onSubmit={(e) => {
        e.preventDefault();
        const q = new FormData(e.currentTarget).get("q");
        apply({ q: typeof q === "string" ? q.trim() : null });
      }}
    >
      <label className="flex flex-col text-sm">
        {c.search}
        <input
          name="q"
          defaultValue={params.get("q") ?? ""}
          placeholder={c.searchPlaceholder}
          className="mt-1 rounded-md border border-stone-300 px-2 py-1.5"
        />
      </label>

      <label className="flex flex-col text-sm">
        {c.category}
        <select
          value={params.get("category") ?? ""}
          onChange={(e) => apply({ category: e.target.value })}
          className="mt-1 rounded-md border border-stone-300 px-2 py-1.5"
        >
          <option value="">{c.all}</option>
          {categories.map((cat) => (
            <option key={cat.slug} value={cat.slug}>{categoryName(cat.slug, cat.name, dict)}</option>
          ))}
        </select>
      </label>

      <label className="flex flex-col text-sm">
        {c.radius}
        <select
          value={params.get("radius") ?? "50"}
          onChange={(e) => apply({ radius: e.target.value })}
          className="mt-1 rounded-md border border-stone-300 px-2 py-1.5"
        >
          {RADII.map((r) => (
            <option key={r} value={r}>{r} km</option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2 pb-2 text-sm">
        <input
          type="checkbox"
          checked={params.get("surplus") === "1"}
          onChange={(e) => apply({ surplus: e.target.checked ? "1" : null })}
        />
        {c.surplusOnly}
      </label>

      <button
        type="button"
        onClick={useMyLocation}
        disabled={locating}
        className="ml-auto rounded-md border border-green-700 px-3 py-1.5 text-sm text-green-800 hover:bg-green-50 disabled:opacity-50"
      >
        {locating ? c.locating : usingMyLocation ? c.updateLocation : c.useLocation}
      </button>
    </form>
  );
}
