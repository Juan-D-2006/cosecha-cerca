"use client";

import { Clock, MapPin, Recycle } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { categoryName, formatNumber, formatPrice, formatTimeLeft, t } from "@/lib/format";
import { categoryIcon } from "@/lib/categoryIcons";
import { listingImage } from "@/lib/images";
import type { NearbyListing } from "@/types/domain";
import { ReserveForm } from "./ReserveForm";

export function ListingCard({ listing }: { listing: NearbyListing }) {
  const { dict, locale } = useI18n();
  const unit = dict.common.units[listing.unit];
  const CatIcon = categoryIcon(listing.category_slug);
  const urgent = new Date(listing.available_until).getTime() - Date.now() < 48 * 3_600_000;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-[var(--shadow-card)] transition-[transform,box-shadow] duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]">
      <div className="relative h-52 overflow-hidden bg-green-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={listingImage(listing.image_url, listing.category_slug)}
          alt={listing.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.05]"
        />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-stone-950/60 to-transparent" />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-stone-50/95 px-2.5 py-1 text-xs font-semibold text-green-900 shadow-sm">
          <CatIcon className="h-3.5 w-3.5" aria-hidden />
          {categoryName(listing.category_slug, listing.category_name, dict)}
        </span>
        {listing.is_surplus && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-xs font-bold text-stone-900 shadow-sm">
            <Recycle className="h-3.5 w-3.5" aria-hidden />
            {dict.catalog.surplus}
          </span>
        )}
        <p className="absolute bottom-3 left-3 rounded-xl bg-clay-500 px-3 py-1.5 text-stone-50 shadow-md">
          <span className="font-display tabular text-xl font-semibold">{formatPrice(Number(listing.price_per_unit), locale)}</span>
          <span className="text-sm text-clay-100"> / {unit}</span>
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <h2 className="text-xl font-semibold leading-tight text-stone-900">{listing.title}</h2>
        <p className="flex items-start gap-1.5 text-sm text-stone-600">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-clay-500" aria-hidden />
          <span>
            {listing.farmer_name}
            {listing.district ? ` · ${listing.district}` : ""} ·{" "}
            <span className="tabular">{formatNumber(listing.distance_km, locale)} km</span>
          </span>
        </p>
        {listing.description && <p className="text-sm text-stone-700">{listing.description}</p>}

        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-2 text-xs">
          <span className={`inline-flex items-center gap-1 font-medium ${urgent ? "text-clay-600" : "text-stone-600"}`}>
            <Clock className="h-3.5 w-3.5" aria-hidden />
            {formatTimeLeft(listing.available_until, dict)}
          </span>
          <span className="tabular text-stone-600">
            {t(dict.catalog.available, {
              qty: formatNumber(Number(listing.quantity_available), locale),
              unit,
              min: formatNumber(Number(listing.min_order_qty), locale),
            })}
          </span>
        </div>

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
