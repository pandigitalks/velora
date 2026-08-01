import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "../../../../../lib/admin-auth";
import { createAdminSupabaseClient } from "../../../../../lib/supabase/admin";
import { isExcludedLingerie, matterhornRequest, sellingPrice, type MatterhornProduct } from "../../../../../lib/matterhorn";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    if (!(await requireAdmin())) return NextResponse.json({ error: "Nuk ke qasje." }, { status: 403 });
    const query = request.nextUrl.searchParams;
    const page = Math.max(1, Number(query.get("page") || 1));
    const limit = Math.min(100, Math.max(12, Number(query.get("limit") || 24)));
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    for (const key of ["brand_id", "category_id", "new_collection"] as const) {
      const value = query.get(key); if (value) params.set(key, value);
    }
    const payload = await matterhornRequest<MatterhornProduct[] | { items?: MatterhornProduct[] }>(`/ITEMS/?${params}`);
    const items = (Array.isArray(payload) ? payload : payload.items || []).filter(item => !isExcludedLingerie(item));
    const ids = items.map(item => String(item.id));
    const admin = createAdminSupabaseClient();
    const { data: existing } = ids.length
      ? await admin.from("listings").select("supplier_product_id").eq("supplier", "matterhorn").in("supplier_product_id", ids)
      : { data: [] as { supplier_product_id: string }[] };
    const imported = new Set((existing || []).map(row => row.supplier_product_id));
    return NextResponse.json({
      page,
      items: items.map(item => {
        const cost = Number(item.prices?.EUR || 0);
        return { ...item, id: String(item.id), cost, final_price: sellingPrice(cost), imported: imported.has(String(item.id)) };
      }),
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Katalogu nuk mund të lexohej." }, { status: 500 });
  }
}
