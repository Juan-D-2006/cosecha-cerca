import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { dbErrorResponse, errorResponse } from "@/lib/http";

const schema = z.object({ status: z.enum(["active", "paused"]) });

/** PATCH /api/listings/:id { status } — el agricultor pausa o reactiva su publicación */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return errorResponse("invalid", 400);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .update({ status: parsed.data.status })
    .eq("id", id)
    .in("status", ["active", "paused"]) // no reactivar agotadas o vencidas
    .select("id, status")
    .maybeSingle();

  if (error) return dbErrorResponse(error);
  if (!data) return errorResponse("forbidden", 403);
  return NextResponse.json({ data });
}
