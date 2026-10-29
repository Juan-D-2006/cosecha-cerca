import { redirect } from "next/navigation";
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
      .select("id, title, unit, price_per_unit, quantity_total, quantity_available, status, available_until, is_surplus")
      .eq("farmer_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100),
    fetchOrders(supabase, user.id, "farmer"),
  ]);

  const locations = locationsRes.data ?? [];
  const listings = (listingsRes.data ?? []) as MyListing[];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">
        {p.title} · {profile.organization_name ?? profile.full_name}
      </h1>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{p.incomingOrders}</h2>
        <OrdersList orders={orders} viewAs="farmer" />
      </section>

      <section className={`${cardCls} space-y-4`}>
        <h2 className="text-lg font-semibold">{p.newListing}</h2>
        {locations.length === 0 ? (
          <p className="text-sm text-amber-800">{p.noLocations}</p>
        ) : (
          <ListingForm locations={locations} categories={categoriesRes.data ?? []} />
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{p.myListings}</h2>
        {listings.length === 0 ? (
          <p className="text-sm text-stone-600">{p.noListings}</p>
        ) : (
          <ul className="divide-y divide-stone-200 rounded-lg border border-stone-200 bg-white">
            {listings.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
                <div className="min-w-40 flex-1">
                  <p className="font-medium">
                    {l.title}
                    {l.is_surplus && (
                      <span className="ml-2 rounded bg-amber-100 px-1.5 text-xs text-amber-900">{dict.catalog.surplus}</span>
                    )}
                  </p>
                  <p className="text-stone-600">
                    {formatPrice(Number(l.price_per_unit), locale)} / {dict.common.units[l.unit]} ·{" "}
                    {t(p.stock, {
                      available: formatNumber(Number(l.quantity_available), locale),
                      total: formatNumber(Number(l.quantity_total), locale),
                      unit: dict.common.units[l.unit],
                    })}{" "}
                    · {formatDateTime(l.available_until, locale)}
                  </p>
                </div>
                <span className="rounded bg-stone-100 px-2 py-0.5 text-xs">{p.listingStatus[l.status]}</span>
                <ListingStatusButton id={l.id} status={l.status} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={`${cardCls} space-y-4`}>
        <h2 className="text-lg font-semibold">{p.locationsTitle}</h2>
        {locations.length > 0 && (
          <ul className="flex flex-wrap gap-2 text-sm">
            {locations.map((l) => (
              <li key={l.id} className="rounded-full bg-green-50 px-3 py-1 text-green-900">
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
