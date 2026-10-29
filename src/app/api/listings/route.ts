import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { dbErrorResponse, errorResponse } from "@/lib/http";
import { catalogQuerySchema, createListingSchema } from "@/lib/validation/listing";

/** GET /api/listings?lat=&lng=&radius=&category=&surplus=1&q= — catálogo por cercanía */
export async function GET(request: Request) {
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const parsed = catalogQuerySchema.safeParse(params);
  if (!parsed.success) {
    return errorResponse("invalid", 400, JSON.stringify(parsed.error.flatten().fieldErrors));
  }
  const q = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("nearby_listings", {
    p_lat: q.lat,
    p_lng: q.lng,
    p_radius_km: q.radius,
    p_category: q.category ?? null,
    p_surplus_only: q.surplus,
    p_search: q.q ?? null,
  });
  if (error) return dbErrorResponse(error);

  return NextResponse.json({ data });
}

/** POST /api/listings — un agricultor publica una cosecha o excedente */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return errorResponse("not_authenticated", 401);

  const body = await request.json().catch(() => null);
  const parsed = createListingSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("invalid", 400, JSON.stringify(parsed.error.flatten().fieldErrors));
  }
  const d = parsed.data;

  // RLS valida que el usuario sea agricultor y que la ubicación le pertenezca.
  const { data, error } = await supabase
    .from("listings")
    .insert({
      farmer_id: user.id,
      location_id: d.locationId,
      category_id: d.categoryId ?? null,
      title: d.title,
      description: d.description ?? null,
      unit: d.unit,
      price_per_unit: d.pricePerUnit,
      quantity_total: d.quantityTotal,
      quantity_available: d.quantityTotal,
      min_order_qty: d.minOrderQty,
      harvested_at: d.harvestedAt ?? null,
      available_until: d.availableUntil,
      is_surplus: d.isSurplus,
      image_url: d.imageUrl,
    })
    .select()
    .single();

  if (error) return dbErrorResponse(error);
  return NextResponse.json({ data }, { status: 201 });
}
