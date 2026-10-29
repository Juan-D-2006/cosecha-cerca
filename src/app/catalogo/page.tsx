import { Suspense } from "react";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { catalogQuerySchema } from "@/lib/validation/listing";
import { CatalogFilters, CatalogSearch } from "@/components/catalog/CatalogFilters";
import { ListingCard } from "@/components/catalog/ListingCard";
import type { Category, NearbyListing } from "@/types/domain";
import { getI18n } from "@/i18n/server";
import { t } from "@/lib/format";
import { MARKET_IMAGE } from "@/lib/images";
import { secondaryBtn } from "@/components/ui";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function CatalogoPage({ searchParams }: { searchParams: SearchParams }) {
  const raw = await searchParams;
  const flat = Object.fromEntries(
    Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
  );
  const parsed = catalogQuerySchema.safeParse(flat);
  const q = parsed.success ? parsed.data : catalogQuerySchema.parse({});

  const { dict } = await getI18n();
  const supabase = await createClient();
  const [listingsRes, categoriesRes] = await Promise.all([
    supabase.rpc("nearby_listings", {
      p_lat: q.lat,
      p_lng: q.lng,
      p_radius_km: q.radius,
      p_category: q.category ?? null,
      p_surplus_only: q.surplus,
      p_search: q.q ?? null,
    }),
    supabase.from("categories").select("slug, name").order("id"),
  ]);

  const listings = (listingsRes.data ?? []) as NearbyListing[];
  const categories = (categoriesRes.data ?? []) as Category[];
  const widenHref = `/catalogo?${new URLSearchParams({ ...(flat as Record<string, string>), radius: "100" })}`;

  return (
    <div className="space-y-6">
      {/* Portada con foto de mercado y buscador */}
      <section className="relative isolate overflow-hidden rounded-3xl bg-green-900 shadow-[var(--shadow-lift)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={MARKET_IMAGE} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-green-950/90 via-green-950/65 to-green-950/10" />
        <div className="max-w-2xl px-6 py-10 sm:px-10 sm:py-14">
          <h1 className="text-4xl font-semibold leading-[1.05] text-stone-50 sm:text-5xl">{dict.catalog.title}</h1>
          <p className="mt-3 max-w-lg text-base text-green-100 sm:text-lg">{dict.catalog.subtitle}</p>
          <div className="mt-6">
            <Suspense>
              <CatalogSearch />
            </Suspense>
          </div>
        </div>
      </section>

      <Suspense>
        <CatalogFilters categories={categories} />
      </Suspense>

      {listingsRes.error ? (
        <p className="rounded-2xl border border-clay-200 bg-clay-50 p-4 text-sm text-clay-800">{dict.catalog.loadError}</p>
      ) : listings.length === 0 ? (
        <div className="flex flex-col items-center rounded-3xl border border-dashed border-stone-300 bg-white/60 px-6 py-14 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-amber-100 text-amber-800">
            <SearchX className="h-7 w-7" aria-hidden />
          </span>
          <p className="mt-4 max-w-sm text-stone-700">{t(dict.catalog.empty, { radius: q.radius })}</p>
          {q.radius < 100 && (
            <Link href={widenHref} className={`${secondaryBtn} mt-5`}>
              {dict.catalog.widenRadius}
            </Link>
          )}
        </div>
      ) : (
        <>
          <p className="flex items-baseline justify-between text-sm text-stone-600">
            <span className="font-display text-lg font-semibold text-stone-900">
              {t(dict.catalog.results, { n: listings.length })}
            </span>
            <span>{dict.catalog.sortedBy}</span>
          </p>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <li key={listing.id}>
                <ListingCard listing={listing} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
