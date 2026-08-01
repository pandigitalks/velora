import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "../../../../../lib/admin-auth";
import { createAdminSupabaseClient } from "../../../../../lib/supabase/admin";
import { matterhornCategorySlug, matterhornRequest, MINIMUM_PROFIT, safeImageUrl, sellingPrice, slugifyBrand, type MatterhornProduct } from "../../../../../lib/matterhorn";

export const maxDuration = 300;

async function uploadProductImages(product: MatterhornProduct, sellerId: string, listingId: string) {
  const admin = createAdminSupabaseClient();
  const rows: { listing_id: string; storage_path: string; sort_order: number }[] = [];
  for (const [index, originalUrl] of (product.images || []).slice(0, 8).entries()) {
    const response = await fetch(safeImageUrl(originalUrl), { signal: AbortSignal.timeout(30000) });
    if (!response.ok) continue;
    const contentType = response.headers.get("content-type") || "image/jpeg";
    const extension = contentType.includes("webp") ? "webp" : contentType.includes("png") ? "png" : "jpg";
    const path = `${sellerId}/matterhorn/${product.id}/${String(index + 1).padStart(2, "0")}.${extension}`;
    const { error } = await admin.storage.from("listing-images").upload(path, new Uint8Array(await response.arrayBuffer()), { contentType, upsert: true });
    if (!error) rows.push({ listing_id: listingId, storage_path: path, sort_order: index });
  }
  if (rows.length) {
    await admin.from("listing_images").delete().eq("listing_id", listingId);
    const { error } = await admin.from("listing_images").insert(rows);
    if (error) throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await requireAdmin())) return NextResponse.json({ error: "Nuk ke qasje." }, { status: 403 });
    const body = await request.json() as { ids?: string[]; shipping?: number; profit?: number };
    const ids = [...new Set((body.ids || []).map(String))].slice(0, 20);
    const shipping = Math.max(0, Number(body.shipping ?? 24));
    const profit = Math.max(MINIMUM_PROFIT, Number(body.profit ?? MINIMUM_PROFIT));
    if (!ids.length) return NextResponse.json({ error: "Zgjidh të paktën një produkt." }, { status: 400 });
    const admin = createAdminSupabaseClient();
    const { data: seller, error: sellerError } = await admin.from("profiles").select("id").eq("username", "clozer.shop").eq("is_admin", true).single();
    if (sellerError || !seller) throw new Error("Profili Clozer Shop nuk u gjet.");
    const results: { id: string; listing_id?: string; status: string; error?: string }[] = [];

    for (const id of ids) {
      try {
        const product = await matterhornRequest<MatterhornProduct>(`/ITEMS/${encodeURIComponent(id)}`);
        const cost = Number(product.prices?.EUR || 0);
        if (!(cost > 0)) throw new Error("Produkti nuk ka çmim EUR.");
        const categorySlug = matterhornCategorySlug(product);
        const [{ data: category }, brandResult] = await Promise.all([
          admin.from("categories").select("id").eq("slug", categorySlug).maybeSingle(),
          admin.from("brands").upsert({ slug: slugifyBrand(product.brand || "Matterhorn"), name: product.brand || "Matterhorn", is_active: true }, { onConflict: "name" }).select("id").single(),
        ]);
        if (brandResult.error) throw brandResult.error;
        const sizes = (product.variants || []).filter(v => Number(v.stock) > 0).map(v => v.name);
        const description = [product.description || "", product.size_table_txt ? `\n\nDetajet e madhësive dhe materialit:\n${product.size_table_txt.trim()}` : ""].join("").trim();
        const listingPayload = {
          seller_id: seller.id, category_id: category?.id || null, brand_id: brandResult.data.id,
          title: (product.name_without_number || product.name).trim(), description,
          price: sellingPrice(cost, shipping, profit), retail_price: null, currency: "EUR",
          condition: "E re", size: sizes.join(", ") || "Një madhësi", color: product.color || null,
          gender: "Femra", city: "Pejë", country_code: "XK", negotiable: false,
          shipping_available: true, status: "active", published_at: new Date().toISOString(),
          supplier: "matterhorn", supplier_product_id: String(product.id), supplier_cost: cost,
          supplier_shipping: shipping, supplier_profit: profit, supplier_payload: product,
          supplier_last_synced_at: new Date().toISOString(), reference_code: `MH-${product.id}`,
        };
        const { data: existing } = await admin.from("listings").select("id").eq("supplier", "matterhorn").eq("supplier_product_id", String(product.id)).maybeSingle();
        const listingRequest = existing
          ? admin.from("listings").update(listingPayload).eq("id", existing.id).select("id").single()
          : admin.from("listings").insert(listingPayload).select("id").single();
        const { data: listing, error: listingError } = await listingRequest;
        if (listingError) throw listingError;
        await admin.from("listing_variants").delete().eq("listing_id", listing.id);
        const variants = (product.variants || []).map(variant => ({
          listing_id: listing.id, supplier_variant_uid: String(variant.variant_uid), name: variant.name,
          stock: Number(variant.stock) || 0, max_processing_time: Number(variant.max_processing_time) || null, ean: variant.ean || null,
        }));
        if (variants.length) { const { error } = await admin.from("listing_variants").insert(variants); if (error) throw error; }
        await uploadProductImages(product, seller.id, listing.id);
        results.push({ id, listing_id: listing.id, status: existing ? "updated" : "imported" });
      } catch (error) {
        results.push({ id, status: "failed", error: error instanceof Error ? error.message : "Gabim gjatë importit." });
      }
    }
    return NextResponse.json({ results, imported: results.filter(x => x.status !== "failed").length, failed: results.filter(x => x.status === "failed").length });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Importi dështoi." }, { status: 500 });
  }
}
