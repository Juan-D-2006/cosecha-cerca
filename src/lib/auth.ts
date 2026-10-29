import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/domain";

/** Usuario actual + su perfil (o null si no hay sesión) */
export async function getSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, profile: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, full_name, organization_name")
    .eq("id", user.id)
    .single<{ id: string; role: UserRole; full_name: string; organization_name: string | null }>();

  return { supabase, user, profile };
}
