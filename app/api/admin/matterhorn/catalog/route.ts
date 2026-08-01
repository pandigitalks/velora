import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "../../../../../lib/admin-auth";
import { createAdminSupabaseClient } from "../../../../../lib/supabase/admin";
import { isExcludedLingerie, matterhornRequest, sellingPrice, type MatterhornProduct } from "../../../../../lib/matterhorn";

export const dynamic = "force-dynamic";

function productList(payload: unknown): MatterhornProduct[] {
  if (Array.isArray(payload)) return payload as MatterhornProduct[];
  if (!payload || typeof payload !== "object") return [];
  const record = payload as Record<string, unknown>;
  for (const key of ["items", "products", "data", "results", "ITEMS"]) {
    if (Array.isArray(record[key])) return record[key] as MatterhornProduct[];
  }
  return [];
}

export async function GET(request: NextRequest) {
  try {
    if (!(await requireAdmin())) return NextResponse.json({ error: "Nuk ke qasje." }, { status: 403 });
    const query = request.nextUrl.searchParams;
    const page = Math.max(1, Number(query.get("page") || 1));
    const limit = Math.min(100, Math.max(12, Number(query.get("limit") || 24)));
    const filters = new URLSearchParams();
    for (const key of ["brand_id", "category_id", "new_collection"] as const) {
      const value = query.get(key); if (value) filters.set(key, value);
    }
    const needed = page * limit;
    const allowed: MatterhornProduct[] = [];
    const upstreamLimit = 200;

    // Matterhorn often puts lingerie first. Filter while paging upstream so a
    // CLOZER page is not empty merely because its first 24 supplier items are excluded.
    for (let upstreamPage = 1; upstreamPage <= 10 && allowed.length < needed; upstreamPage += 1) {
      const params = new URLSearchParams(filters);
      params.set("page", String(upstreamPage));
      params.set("limit", String(upstreamLimit));
      const payload = await matterhornRequest<unknown>(`/ITEMS/?${params}`);
      const batch = productList(payload);
      allowed.push(...batch.filter(item => !isExcludedLingerie(item)));
      if (batch.length < upstreamLimit) break;
    }
    const items = allowed.slice((page - 1) * limit, page * limit);
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
