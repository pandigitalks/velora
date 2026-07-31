import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "../../lib/supabase/server";
import AdminDashboard from "./admin-dashboard";

export const metadata = { title: "Admin Command Center — CLOZER" };

export default async function AdminPage() {
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;

  if (!userId) redirect("/?login=account&next=/admin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, username, avatar_url, is_admin")
    .eq("id", userId)
    .single();

  if (!profile?.is_admin) redirect("/?admin=forbidden");

  const { data, error } = await supabase.rpc("admin_dashboard_snapshot");
  if (error) throw new Error(`Admin dashboard: ${error.message}`);

  return <AdminDashboard initialData={data} admin={profile} />;
}
