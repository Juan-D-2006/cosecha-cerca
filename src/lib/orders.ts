import type { SupabaseClient } from "@supabase/supabase-js";
import type { OrderRow } from "@/types/domain";

const ITEMS = "order_items(quantity, unit_price, subtotal, listings(title, unit))";
const PARTY = "full_name, organization_name, phone";

/** Pedidos del usuario según su rol, con datos de la contraparte */
export async function fetchOrders(supabase: SupabaseClient, userId: string, as: "farmer" | "buyer") {
  const select =
    as === "farmer"
      ? `id, status, total, created_at, reserved_until, notes, buyer:profiles!orders_buyer_id_fkey(${PARTY}), ${ITEMS}`
      : `id, status, total, created_at, reserved_until, notes, farmer:profiles!orders_farmer_id_fkey(${PARTY}), ${ITEMS}`;

  const { data, error } = await supabase
    .from("orders")
    .select(select)
    .eq(as === "farmer" ? "farmer_id" : "buyer_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  return { orders: (data ?? []) as unknown as OrderRow[], error };
}
