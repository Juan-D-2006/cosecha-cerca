import { redirect } from "next/navigation";
import { Boxes, Inbox, MapPin, PackagePlus, type LucideIcon } from "lucide-react";
import { getSession } from "@/lib/auth";
import { getI18n } from "@/i18n/server";
import { fetchOrders } from "@/lib/orders";
import { formatDateTime, formatNumber, formatPrice, t } from "@/lib/format";
import { cardCls } from "@/components/ui";
import { LocationForm } from "@/components/panel/LocationForm";
import { ListingForm } from "@/components/panel/ListingForm";
import { ListingStatusButton } from "@/components/panel/ListingStatusButton";
import { OrdersList } from "@/components/orders/OrdersList";
import type { ListingStatus, UnitType } from "@/types/domain";
import { listingImage } from "@/lib/images";

interface MyListing {
  id: string;
  title: string;
  unit: UnitType;
  price_per_unit: number;
  quantity_total: number;
  quantity_available: number;
  status: ListingStatus;
  available_until: string;
  is_surplus: boolean;
  image_url: string | null;
  categories: { slug: string } | null;
}

const STATUS_STYLE: Record<ListingStatus, string> = {
  active: "bg-green-100 text-green-800",
  paused: "bg-stone-200 text-stone-700",
  sold_out: "bg-clay-100 text-clay-700",
  expired: "bg-stone-100 text-stone-500",
};

function SectionTitle({ Icon, children, count }: { Icon: LucideIcon; children: React.ReactNode; count?: number }) {
  return (
    <h2 className="flex items-center gap-2.5 text-xl font-semibold text-stone-900">
      <span className="grid h-9 w-9 place-items-center rounded-full bg-amber-100 text-amber-800">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      {children}
      {count !== undefined && count > 0 && (
        <span className="tabular rounded-full bg-clay-500 px-2 py-0.5 font-sans text-xs font-bold text-stone-50">{count}</span>
      )}
    </h2>
  );
}

export default async function PanelPage() {
  const { supabase, user, profile } = await getSession();
  if (!user) redirect("/login?next=/panel");
  if (profile?.role !== "farmer") redirect("/catalogo");

  const { dict, locale } = await getI18n();
  const p = dict.panel;

  const [locationsRes, categoriesRes, listingsRes, { orders }] = await Promise.all([
    supabase.from("locations").select("id, label, district").eq("owner_id", user.id).order("created_at"),
    supabase.from("categories").select("id, slug, name").order("id"),
    supabase
      .from("listings")
      .select("id, title, unit, price_per_unit, quantity_total, quantity_available, status, available_until, is_surplus, image_url, categories(slug)")
      .eq("farmer_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100),
    fetchOrders(supabase, user.id, "farmer"),
  ]);

  const locations = locationsRes.data ?? [];
  const listings = (listingsRes.data ?? []) as unknown as MyListing[];
  const openOrders = orders.filter((o) => ["pending", "confirmed", "ready"].includes(o.status)).length;

  return (
    <div className="space-y-10">
      <header className="relative overflow-hidden rounded-3xl bg-green-800 px-6 py-8 text-stone-50 sm:px-10 sm:py-10">
        <div aria-hidden className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-amber-400/90" />
        <div aria-hidden className="absolute -right-4 top-24 h-40 w-[28rem] rounded-[100%] border-[10px] border-clay-500/80" />
        <p className="relative text-sm font-medium text-green-200">{p.title}</p>
        <h1 className="relative mt-1 text-4xl font-semibold leading-tight sm:text-5xl">
          {t(p.greeting, { name: profile.organization_name ?? profile.full_name })}
        </h1>
        <p className="relative mt-2 max-w-xl text-green-100">{p.subtitle}</p>
      </header>

      <section className="space-y-4">
        <SectionTitle Icon={Inbox} count={openOrders}>{p.incomingOrders}</SectionTitle>
        <OrdersList orders={orders} viewAs="farmer" />
      </section>

      <section className={`${cardCls} space-y-5`}>
        <SectionTitle Icon={PackagePlus}>{p.newListing}</SectionTitle>
        {locations.length === 0 ? (
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{p.noLocations}</p>
        ) : (
          <ListingForm locations={locations} categories={categoriesRes.data ?? []} />
        )}
      </section>

      <section className="space-y-4">
        <SectionTitle Icon={Boxes}>{p.myListings}</SectionTitle>
        {listings.length === 0 ? (
          <p className="text-sm text-stone-600">{p.noListings}</p>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {listings.map((l) => (
              <li
                key={l.id}
                className="flex items-center gap-4 rounded-2xl border border-stone-200/80 bg-white p-3 text-sm shadow-[var(--shadow-card)]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={listingImage(l.image_url, l.categories?.slug ?? null)}
                  alt=""
                  className="h-20 w-24 shrink-0 rounded-xl object-cover"
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-base font-semibold text-stone-900">{l.title}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[l.status]}`}>
                      {p.listingStatus[l.status]}
                    </span>
                    {l.is_surplus && (
                      <span className="rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-stone-900">{dict.catalog.surplus}</span>
                    )}
                  </p>
                  <p className="tabular text-stone-600">
                    <span className="font-semibold text-clay-600">{formatPrice(Number(l.price_per_unit), locale)}</span> /{" "}
                    {dict.common.units[l.unit]} ·{" "}
                    {t(p.stock, {
                      available: formatNumber(Number(l.quantity_available), locale),
                      total: formatNumber(Number(l.quantity_total), locale),
                      unit: dict.common.units[l.unit],
                    })}
                  </p>
                  <p className="text-xs text-stone-500">{formatDateTime(l.available_until, locale)}</p>
                </div>
                <ListingStatusButton id={l.id} status={l.status} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={`${cardCls} space-y-5`}>
        <SectionTitle Icon={MapPin}>{p.locationsTitle}</SectionTitle>
        {locations.length > 0 && (
          <ul className="flex flex-wrap gap-2 text-sm">
            {locations.map((l) => (
              <li key={l.id} className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 font-medium text-green-900">
                <MapPin className="h-3.5 w-3.5 text-clay-500" aria-hidden />
                {l.label}
                {l.district ? ` · ${l.district}` : ""}
              </li>
            ))}
          </ul>
        )}
        <LocationForm />
      </section>
    </div>
  );
}
