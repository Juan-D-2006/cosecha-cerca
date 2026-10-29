import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { dbErrorResponse, errorResponse } from "@/lib/http";
import { updateOrderStatusSchema } from "@/lib/validation/order";

/** PATCH /api/orders/:id  { status: "confirmed" | "ready" | "completed" | "cancelled" } */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updateOrderStatusSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("invalid", 400, JSON.stringify(parsed.error.flatten().fieldErrors));
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_order_status", {
    p_order_id: id,
    p_status: parsed.data.status,
  });
  if (error) return dbErrorResponse(error);

  return NextResponse.json({ data: { id, status: parsed.data.status } });
}
