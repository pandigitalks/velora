import { createServerSupabaseClient } from "./supabase/server";

export async function requireAdmin() {
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId) return null;
  const { data: profile } = await supabase.from("profiles").select("id,is_admin").eq("id", userId).maybeSingle();
  return profile?.is_admin ? profile.id : null;
}
