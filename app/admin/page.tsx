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

  const [
    { data, error },
    { data: moderationQueue, error: queueError },
    { data: sellerApplications, error: sellerError },
  ] =
    await Promise.all([
      supabase.rpc("admin_dashboard_snapshot"),
      supabase
        .from("listings")
        .select(
          "id,title,price,currency,status,moderation_note,created_at,seller:profiles!listings_seller_id_fkey(full_name,username),brand:brands(name),category:categories(name_sq),listing_images(storage_path,sort_order)",
        )
        .in("status", ["pending_review", "changes_requested"])
        .order("created_at", { ascending: true }),
      supabase
        .from("seller_applications")
        .select("user_id,display_name,phone,city,seller_type,note,status,created_at")
        .eq("status", "pending")
        .order("created_at", { ascending: true }),
    ]);
  if (error) throw new Error(`Admin dashboard: ${error.message}`);
  if (queueError) throw new Error(`Moderation queue: ${queueError.message}`);
  if (sellerError) throw new Error(`Seller applications: ${sellerError.message}`);

  return <AdminDashboard initialData={data} initialModerationQueue={moderationQueue || []} initialSellerApplications={sellerApplications || []} admin={profile} />;
}
