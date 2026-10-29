import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { dbErrorResponse, errorResponse } from "@/lib/http";
import { createLocationSchema } from "@/lib/validation/location";

/** POST /api/locations — agrega un punto de recojo del agricultor */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return errorResponse("not_authenticated", 401);

  const parsed = createLocationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return errorResponse("invalid", 400, JSON.stringify(parsed.error.flatten().fieldErrors));
  }
  const d = parsed.data;

  const { count } = await supabase
    .from("locations")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", user.id);

  const { data, error } = await supabase
    .from("locations")
    .insert({
      owner_id: user.id,
      label: d.label,
      district: d.district ?? null,
      address: d.address ?? null,
      geog: `SRID=4326;POINT(${d.lng} ${d.lat})`, // PostGIS acepta EWKT
      is_default: (count ?? 0) === 0,
    })
    .select("id, label, district")
    .single();

  if (error) return dbErrorResponse(error);
  return NextResponse.json({ data }, { status: 201 });
}
