import type { Metadata } from "next";
import { createServerSupabaseClient } from "../../lib/supabase/server";
import WaitlistLanding from "./waitlist-landing";

export const metadata: Metadata = {
  title: "Hyr para të gjithëve — CLOZER",
  description: "Rezervo qasjen e hershme në CLOZER dhe hyr në short për një nga 3 Gift Cards me vlerë 100 €.",
};

export default async function WaitlistPage({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const supabase = await createServerSupabaseClient();
  const [{ data }, params] = await Promise.all([supabase.rpc("waitlist_public_stats"), searchParams]);
  return <WaitlistLanding initialStats={data || { enabled: false, total: 0, gift_cards: 3, gift_value: 100 }} initialReferral={params.ref || ""} />;
}
