import { createClient } from "../supabase/client";

export type NewListingInput = {
  title: string;
  brand: string;
  category: string;
  condition: string;
  gender: string;
  size: string;
  retailPrice: number;
  price: number;
  image?: string;
  images?: string[];
};

export type PublicListing = {
  id: string;
  title: string;
  description: string;
  price: number;
  condition: string;
  size: string;
  color: string;
  material: string;
  gender: string;
  city: string;
  category: string;
  brand: string;
  seller: string;
  sellerSlug: string;
  sellerAvatar: string | null;
  sellerVerified: boolean;
  images: string[];
  viewsCount: number;
  publishedAt: string | null;
  authenticityStatus: string;
  shippingAvailable: boolean;
  negotiable: boolean;
  boostTier: string | null;
};

type PublicListingRow = {
  id: string;
  title: string;
  description: string;
  price: number | string;
  condition: string;
  size: string | null;
  color: string | null;
  material: string | null;
  gender: string | null;
  city: string | null;
  views_count: number | string;
  published_at: string | null;
  authenticity_status: string;
  shipping_available: boolean;
  negotiable: boolean;
  brand: { name: string } | null;
  category: { name_sq: string } | null;
  seller: {
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    seller_verified: boolean;
  } | null;
  listing_images: Array<{ storage_path: string; sort_order: number }>;
  listing_boosts: Array<{ tier: string; status: string; expires_at: string | null }>;
};

const sellerSlug = (name: string) =>
  name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export async function getPublicListings(): Promise<PublicListing[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("listings")
    .select(
      "id,title,description,price,condition,size,color,material,gender,city,views_count,published_at,authenticity_status,shipping_available,negotiable,brand:brands(name),category:categories(name_sq),seller:profiles!listings_seller_id_fkey(full_name,username,avatar_url,seller_verified),listing_images(storage_path,sort_order),listing_boosts(tier,status,expires_at)",
    )
    .eq("status", "active")
    .order("published_at", { ascending: false });

  if (error) throw error;

  return ((data ?? []) as unknown as PublicListingRow[]).map((row) => {
    const sellerName =
      row.seller?.full_name || row.seller?.username || "Shitës CLOZER";
    const images = [...(row.listing_images ?? [])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(
        ({ storage_path }) =>
          supabase.storage.from("listing-images").getPublicUrl(storage_path)
            .data.publicUrl,
      );

    return {
      id: row.id,
      title: row.title,
      description: row.description,
      price: Number(row.price),
      condition: row.condition,
      size: row.size || "Nuk është specifikuar",
      color: row.color || "Nuk është specifikuar",
      material: row.material || "Nuk është specifikuar",
      gender: row.gender || "Unisex",
      city: row.city || "Kosovë",
      category: row.category?.name_sq || "Modë",
      brand: row.brand?.name || "Pa brend",
      seller: sellerName,
      sellerSlug: row.seller?.username || sellerSlug(sellerName),
      sellerAvatar: row.seller?.avatar_url || null,
      sellerVerified: Boolean(row.seller?.seller_verified),
      images,
      viewsCount: Number(row.views_count || 0),
      publishedAt: row.published_at,
      authenticityStatus: row.authenticity_status,
      shippingAvailable: row.shipping_available,
      negotiable: row.negotiable,
      boostTier:
        row.listing_boosts?.find(
          (boost) =>
            boost.status === "active" &&
            (!boost.expires_at || new Date(boost.expires_at).getTime() > Date.now()),
        )?.tier || null,
    };
  });
}

function dataUrlToBlob(dataUrl: string) {
  const [metadata, value] = dataUrl.split(",", 2);
  const mime = metadata.match(/^data:([^;]+);base64$/)?.[1] ?? "image/jpeg";
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new Blob([bytes], { type: mime });
}

export async function createListing(input: NewListingInput) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Duhet të kyçesh para publikimit.");

  const [{ data: category }, { data: brand }] = await Promise.all([
    supabase
      .from("categories")
      .select("id")
      .eq("slug", input.category.toLowerCase())
      .maybeSingle(),
    supabase
      .from("brands")
      .select("id")
      .ilike("name", input.brand)
      .maybeSingle(),
  ]);

  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .insert({
      seller_id: user.id,
      category_id: category?.id ?? null,
      brand_id: brand?.id ?? null,
      title: input.title,
      description:
        "Produkt i ruajtur me kujdes. Fotografitë paraqesin gjendjen aktuale.",
      price: input.price,
      condition: input.condition,
      gender: input.gender,
      size: input.size,
      status: "pending_review",
      published_at: null,
    })
    .select("id")
    .single();

  if (listingError) throw listingError;

  const images = (input.images?.length ? input.images : [input.image]).filter(
    (value): value is string => Boolean(value?.startsWith("data:")),
  );
  const uploadedPaths: string[] = [];

  for (let index = 0; index < images.length; index += 1) {
    const blob = dataUrlToBlob(images[index]);
    const extension =
      blob.type === "image/png"
        ? "png"
        : blob.type === "image/webp"
          ? "webp"
          : "jpg";
    const path = `${user.id}/${listing.id}/${String(index + 1).padStart(2, "0")}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("listing-images")
      .upload(path, blob, { contentType: blob.type, upsert: false });

    if (uploadError) {
      if (uploadedPaths.length)
        await supabase.storage.from("listing-images").remove(uploadedPaths);
      await supabase.from("listings").delete().eq("id", listing.id);
      throw uploadError;
    }
    uploadedPaths.push(path);
  }

  if (uploadedPaths.length) {
    const { error: imageError } = await supabase.from("listing_images").insert(
      uploadedPaths.map((storagePath, sortOrder) => ({
        listing_id: listing.id,
        storage_path: storagePath,
        sort_order: sortOrder,
      })),
    );
    if (imageError) {
      await supabase.storage.from("listing-images").remove(uploadedPaths);
      await supabase.from("listings").delete().eq("id", listing.id);
      throw imageError;
    }
  }

  return listing.id as string;
}
