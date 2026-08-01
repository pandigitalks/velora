import Marketplace from "./marketplace-v2";
import { createServerSupabaseClient } from "../lib/supabase/server";
import WaitlistLanding from "./waitlist/waitlist-landing";

export default async function Home() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.rpc("waitlist_public_stats");
  if (data?.enabled) return <WaitlistLanding initialStats={data} />;
  return <Marketplace />;
}
