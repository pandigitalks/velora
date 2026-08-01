import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "../../../../../lib/admin-auth";
import { createAdminSupabaseClient } from "../../../../../lib/supabase/admin";
import { matterhornRequest, sellingPrice, type MatterhornProduct } from "../../../../../lib/matterhorn";

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
    const limit = Math.min(30, Math.max(20, Number(query.get("limit") || 30)));
    const filters = new URLSearchParams();
    for (const key of ["brand_id", "category_id", "new_collection"] as const) {
      const value = query.get(key); if (value) filters.set(key, value);
    }
    // Fetch only the requested page size. Every supplier category is available;
    // the administrator decides what to view and import from the category filter.
    const params = new URLSearchParams(filters);
    params.set("page", String(page));
    params.set("limit", String(limit));
    const payload = await matterhornRequest<unknown>(`/ITEMS/?${params}`);
    const items = productList(payload).slice(0, limit);
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
