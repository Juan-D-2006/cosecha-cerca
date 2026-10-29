import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { catalogQuerySchema } from "@/lib/validation/listing";
import { CatalogFilters } from "@/components/catalog/CatalogFilters";
import { ListingCard } from "@/components/catalog/ListingCard";
import type { Category, NearbyListing } from "@/types/domain";
import { getI18n } from "@/i18n/server";
import { t } from "@/lib/format";

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
    supabase.from("categories").select("slug, name").order("name"),
  ]);

  const listings = (listingsRes.data ?? []) as NearbyListing[];
  const categories = (categoriesRes.data ?? []) as Category[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{dict.catalog.title}</h1>
        <p className="text-sm text-stone-600">{dict.catalog.subtitle}</p>
      </div>

      <Suspense>
        <CatalogFilters categories={categories} />
      </Suspense>

      {listingsRes.error ? (
        <p className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          {dict.catalog.loadError}
        </p>
      ) : listings.length === 0 ? (
        <p className="rounded-md bg-white p-8 text-center text-stone-600">
          {t(dict.catalog.empty, { radius: q.radius })}
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <li key={listing.id}>
              <ListingCard listing={listing} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
