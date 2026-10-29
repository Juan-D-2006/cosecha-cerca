"use client";

import { useI18n } from "@/i18n/client";
import { categoryName, formatNumber, formatPrice, formatTimeLeft, t } from "@/lib/format";
import type { NearbyListing } from "@/types/domain";
import { ReserveForm } from "./ReserveForm";

export function ListingCard({ listing }: { listing: NearbyListing }) {
  const { dict, locale } = useI18n();
  const unit = dict.common.units[listing.unit];

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-lg border border-stone-200 bg-white">
      {listing.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={listing.image_url} alt="" className="h-40 w-full object-cover" />
      ) : (
        <div className="flex h-28 items-center justify-center bg-green-50 text-sm font-medium text-green-800">
          {categoryName(listing.category_slug, listing.category_name, dict)}
        </div>
      )}

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex flex-wrap gap-2 text-xs">
          {listing.is_surplus && (
            <span className="rounded bg-amber-100 px-2 py-0.5 font-medium text-amber-900">{dict.catalog.surplus}</span>
          )}
          <span className="rounded bg-stone-100 px-2 py-0.5 text-stone-700">
            {formatTimeLeft(listing.available_until, dict)}
          </span>
        </div>

        <h2 className="text-lg font-semibold leading-tight">{listing.title}</h2>
        <p className="text-sm text-stone-600">
          {listing.farmer_name}
          {listing.district ? ` · ${listing.district}` : ""} · {formatNumber(listing.distance_km, locale)} km
        </p>
        {listing.description && <p className="text-sm text-stone-700">{listing.description}</p>}

        <p className="mt-auto text-sm">
          <span className="text-lg font-semibold">{formatPrice(listing.price_per_unit, locale)}</span> / {unit}
          <span className="block text-stone-600">
            {t(dict.catalog.available, {
              qty: formatNumber(listing.quantity_available, locale),
              unit,
              min: formatNumber(listing.min_order_qty, locale),
            })}
          </span>
        </p>

        <ReserveForm
          listingId={listing.id}
          min={Number(listing.min_order_qty)}
          max={Number(listing.quantity_available)}
          unitLabel={unit}
        />
      </div>
    </article>
  );
}
