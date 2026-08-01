import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "../../../lib/supabase/server";
import AdminLoginForm from "./admin-login-form";
import "./admin-login.css";

export const metadata = { title: "Hyrja e administratorit — CLOZER" };

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (userId) {
    const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", userId).single();
    if (profile?.is_admin) redirect("/admin");
  }
  const params = await searchParams;
  return <AdminLoginForm forbidden={params.error === "forbidden"} />;
}
