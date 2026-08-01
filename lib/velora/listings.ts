import { createClient } from "../supabase/client";

export type ListingInput = {
  title: string;
  brand: string;
  category: string;
  condition: string;
  gender: string;
  size: string;
  retailPrice: number;
  price: number;
  description: string;
  color: string;
  material: string;
  reference: string;
  city: string;
  negotiable: boolean;
  shippingAvailable: boolean;
  image?: string;
  images?: string[];
};

export type NewListingInput = ListingInput;

export type SellerListing = ListingInput & {
  id: string;
  status: string;
  viewsCount: number;
  publishedAt: string | null;
  images: string[];
  sizes: string[];
};

export type PublicListing = Omit<SellerListing, "retailPrice" | "reference"> & {
  sellerId: string;
  seller: string;
  sellerSlug: string;
  sellerAvatar: string | null;
  sellerVerified: boolean;
  authenticityStatus: string;
  boostTier: string | null;
};

type ListingRow = {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  price: number | string;
  retail_price: number | string | null;
  reference_code: string | null;
  condition: string;
  size: string | null;
  color: string | null;
  material: string | null;
  gender: string | null;
  city: string | null;
  status: string;
  views_count: number | string;
  published_at: string | null;
  authenticity_status: string;
  shipping_available: boolean;
  negotiable: boolean;
  brand: { name: string } | null;
  category: { slug: string; name_sq: string } | null;
  seller?: { full_name: string | null; username: string | null; avatar_url: string | null; seller_verified: boolean } | null;
  listing_images: Array<{ storage_path: string; sort_order: number }>;
  listing_variants?: Array<{ name: string; stock: number | string }>;
  listing_boosts?: Array<{ tier: string; status: string; expires_at: string | null }>;
};

const listingSelect = "id,seller_id,title,description,price,retail_price,reference_code,condition,size,color,material,gender,city,status,views_count,published_at,authenticity_status,shipping_available,negotiable,brand:brands(name),category:categories(slug,name_sq),listing_images(storage_path,sort_order),listing_variants(name,stock)";

const sellerSlug = (name: string) => name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const publicUrls = (supabase: ReturnType<typeof createClient>, images: ListingRow["listing_images"]) =>
  [...(images ?? [])].sort((a, b) => a.sort_order - b.sort_order).map(({ storage_path }) =>
    supabase.storage.from("listing-images").getPublicUrl(storage_path).data.publicUrl,
  );

const asInput = (supabase: ReturnType<typeof createClient>, row: ListingRow): SellerListing => ({
  id: row.id,
  title: row.title,
  brand: row.brand?.name || "Pa brend",
  category: row.category?.slug || "",
  condition: row.condition,
  gender: row.gender || "Unisex",
  size: row.size || "",
  retailPrice: Number(row.retail_price || 0),
  price: Number(row.price),
  description: row.description || "",
  color: row.color || "",
  material: row.material || "",
  reference: row.reference_code || "",
  city: row.city || "",
  negotiable: row.negotiable,
  shippingAvailable: row.shipping_available,
  image: publicUrls(supabase, row.listing_images)[0] || "",
  images: publicUrls(supabase, row.listing_images),
  sizes: (row.listing_variants || []).filter(variant => Number(variant.stock) > 0).map(variant => variant.name),
  status: row.status,
  viewsCount: Number(row.views_count || 0),
  publishedAt: row.published_at,
});

async function resolveRelations(supabase: ReturnType<typeof createClient>, input: ListingInput) {
  const [{ data: category }, { data: brand }] = await Promise.all([
    supabase.from("categories").select("id").eq("slug", input.category.toLowerCase()).maybeSingle(),
    supabase.from("brands").select("id").ilike("name", input.brand).maybeSingle(),
  ]);
  return { categoryId: category?.id ?? null, brandId: brand?.id ?? null };
}

function dataUrlToBlob(dataUrl: string) {
  const [metadata, value] = dataUrl.split(",", 2);
  const mime = metadata.match(/^data:([^;]+);base64$/)?.[1] ?? "image/jpeg";
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new Blob([bytes], { type: mime });
}

async function uploadImages(supabase: ReturnType<typeof createClient>, userId: string, listingId: string, dataUrls: string[]) {
  const paths: string[] = [];
  for (const [index, dataUrl] of dataUrls.entries()) {
    const blob = dataUrlToBlob(dataUrl);
    const extension = blob.type === "image/png" ? "png" : blob.type === "image/webp" ? "webp" : "jpg";
    const path = `${userId}/${listingId}/${String(index + 1).padStart(2, "0")}-${Date.now()}.${extension}`;
    const { error } = await supabase.storage.from("listing-images").upload(path, blob, { contentType: blob.type, upsert: false });
    if (error) {
      if (paths.length) await supabase.storage.from("listing-images").remove(paths);
      throw error;
    }
    paths.push(path);
  }
  if (paths.length) {
    const { error } = await supabase.from("listing_images").insert(paths.map((storage_path, sort_order) => ({ listing_id: listingId, storage_path, sort_order })));
    if (error) {
      await supabase.storage.from("listing-images").remove(paths);
      throw error;
    }
  }
}

export async function getPublicListings(): Promise<PublicListing[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("listings").select(`${listingSelect},seller:profiles!listings_seller_id_fkey(full_name,username,avatar_url,seller_verified),listing_boosts(tier,status,expires_at)`).eq("status", "active").order("published_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown as ListingRow[]).map((row) => {
    const value = asInput(supabase, row);
    const sellerName = row.seller?.full_name || row.seller?.username || "Shitës CLOZER";
    return { ...value, sellerId: row.seller_id, seller: sellerName, sellerSlug: row.seller?.username || sellerSlug(sellerName), sellerAvatar: row.seller?.avatar_url || null, sellerVerified: Boolean(row.seller?.seller_verified), authenticityStatus: row.authenticity_status, boostTier: row.listing_boosts?.find((boost) => boost.status === "active" && (!boost.expires_at || new Date(boost.expires_at).getTime() > Date.now()))?.tier || null };
  });
}

export async function getSellerListings(): Promise<SellerListing[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase.from("listings").select(listingSelect).eq("seller_id", user.id).order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown as ListingRow[]).map((row) => asInput(supabase, row));
}

export async function createListing(input: NewListingInput) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Duhet të kyçesh para publikimit.");
  const relations = await resolveRelations(supabase, input);
  const { data: listing, error } = await supabase.from("listings").insert({ seller_id: user.id, category_id: relations.categoryId, brand_id: relations.brandId, title: input.title, description: input.description, price: input.price, retail_price: input.retailPrice || null, reference_code: input.reference || null, condition: input.condition, gender: input.gender, size: input.size, color: input.color || null, material: input.material || null, city: input.city || null, negotiable: input.negotiable, shipping_available: input.shippingAvailable, status: "pending_review", published_at: null }).select("id").single();
  if (error) throw error;
  const images = (input.images?.length ? input.images : [input.image]).filter((value): value is string => Boolean(value?.startsWith("data:")));
  try { await uploadImages(supabase, user.id, listing.id, images); } catch (uploadError) { await supabase.from("listings").delete().eq("id", listing.id); throw uploadError; }
  return listing.id as string;
}

export async function updateListing(input: SellerListing, replacementImages: string[] = []) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Duhet të kyçesh para ruajtjes.");
  const relations = await resolveRelations(supabase, input);
  const { error } = await supabase.from("listings").update({ category_id: relations.categoryId, brand_id: relations.brandId, title: input.title, description: input.description, price: input.price, retail_price: input.retailPrice || null, reference_code: input.reference || null, condition: input.condition, gender: input.gender, size: input.size, color: input.color || null, material: input.material || null, city: input.city || null, negotiable: input.negotiable, shipping_available: input.shippingAvailable }).eq("id", input.id).eq("seller_id", user.id);
  if (error) throw error;
  if (replacementImages.length) {
    const { data: oldImages, error: oldError } = await supabase.from("listing_images").select("storage_path").eq("listing_id", input.id);
    if (oldError) throw oldError;
    const { error: deleteError } = await supabase.from("listing_images").delete().eq("listing_id", input.id);
    if (deleteError) throw deleteError;
    if (oldImages?.length) await supabase.storage.from("listing-images").remove(oldImages.map((image) => image.storage_path));
    await uploadImages(supabase, user.id, input.id, replacementImages);
  }
}
