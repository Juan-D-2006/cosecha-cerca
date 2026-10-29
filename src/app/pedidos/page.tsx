import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getI18n } from "@/i18n/server";
import { fetchOrders } from "@/lib/orders";
import { OrdersList } from "@/components/orders/OrdersList";

export default async function MyOrdersPage() {
  const { supabase, user, profile } = await getSession();
  if (!user) redirect("/login?next=/pedidos");
  if (profile?.role === "farmer") redirect("/panel");

  const { dict } = await getI18n();
  const { orders } = await fetchOrders(supabase, user.id, "buyer");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{dict.orders.title}</h1>
        <Link href="/catalogo" className="text-sm text-green-800 underline">{dict.orders.goCatalog}</Link>
      </div>
      <OrdersList orders={orders} viewAs="buyer" />
    </div>
  );
}
