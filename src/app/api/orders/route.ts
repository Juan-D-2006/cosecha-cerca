import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { dbErrorResponse, errorResponse } from "@/lib/http";
import { createOrderSchema } from "@/lib/validation/order";

/** GET /api/orders — pedidos del usuario (como comprador o agricultor) */
export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(quantity, unit_price, subtotal, listings(title, unit))")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) return dbErrorResponse(error);
  return NextResponse.json({ data });
}

/** POST /api/orders — reserva stock de forma atómica (función SQL create_order) */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("invalid", 400, JSON.stringify(parsed.error.flatten().fieldErrors));
  }
  const d = parsed.data;

  const supabase = await createClient();
  const { data: orderId, error } = await supabase.rpc("create_order", {
    p_items: d.items.map((i) => ({ listing_id: i.listingId, quantity: i.quantity })),
    p_fulfillment: d.fulfillment,
    p_pickup_at: d.pickupAt ?? null,
    p_notes: d.notes ?? null,
  });
  if (error) return dbErrorResponse(error);

  return NextResponse.json({ data: { id: orderId } }, { status: 201 });
}
