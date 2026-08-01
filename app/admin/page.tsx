import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "../../lib/supabase/server";
import AdminDashboard from "./admin-dashboard";

export const metadata = { title: "Admin Command Center — CLOZER" };

export default async function AdminPage() {
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;

  if (!userId) redirect("/admin/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, username, avatar_url, is_admin")
    .eq("id", userId)
    .single();

  if (!profile?.is_admin) redirect("/admin/login?error=forbidden");

  const [
    { data, error },
    { data: moderationQueue, error: queueError },
    { data: sellerApplications, error: sellerError },
    { data: blogPosts, error: blogError },
    { data: waitlistEntries, error: waitlistError },
    { data: siteSettings, error: settingsError },
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
      supabase
        .from("blog_posts")
        .select("id,slug,title,excerpt,content,category,cover_image,status,featured,published_at,created_at,updated_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("waitlist_entries")
        .select("id,position,full_name,email,phone,interest,referral_code,referred_by,status,is_winner,winner_value,admin_note,created_at")
        .order("position", { ascending: true }),
      supabase
        .from("site_settings")
        .select("waitlist_enabled,waitlist_gift_cards,waitlist_gift_value")
        .eq("id", "global")
        .single(),
    ]);
  if (error) throw new Error(`Admin dashboard: ${error.message}`);
  if (queueError) throw new Error(`Moderation queue: ${queueError.message}`);
  if (sellerError) throw new Error(`Seller applications: ${sellerError.message}`);
  if (blogError) throw new Error(`Blog posts: ${blogError.message}`);
  if (waitlistError) throw new Error(`Waitlist: ${waitlistError.message}`);
  if (settingsError) throw new Error(`Site settings: ${settingsError.message}`);

  return <AdminDashboard initialData={data} initialModerationQueue={moderationQueue || []} initialSellerApplications={sellerApplications || []} initialBlogPosts={blogPosts || []} initialWaitlist={waitlistEntries || []} initialSiteSettings={siteSettings || { waitlist_enabled: false, waitlist_gift_cards: 3, waitlist_gift_value: 100 }} admin={profile} />;
}
