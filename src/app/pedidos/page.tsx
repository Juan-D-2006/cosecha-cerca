import Link from "next/link";
import { redirect } from "next/navigation";
import { Store } from "lucide-react";
import { getSession } from "@/lib/auth";
import { getI18n } from "@/i18n/server";
import { fetchOrders } from "@/lib/orders";
import { OrdersList } from "@/components/orders/OrdersList";
import { secondaryBtn } from "@/components/ui";

export default async function MyOrdersPage() {
  const { supabase, user, profile } = await getSession();
  if (!user) redirect("/login?next=/pedidos");
  if (profile?.role === "farmer") redirect("/panel");

  const { dict } = await getI18n();
  const { orders } = await fetchOrders(supabase, user.id, "buyer");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold text-stone-900">{dict.orders.title}</h1>
          <p className="mt-1 text-stone-600">{dict.orders.subtitle}</p>
        </div>
        <Link href="/catalogo" className={secondaryBtn}>
          <Store className="h-4 w-4" aria-hidden />
          {dict.orders.goCatalog}
        </Link>
      </div>
      <OrdersList orders={orders} viewAs="buyer" />
    </div>
  );
}
