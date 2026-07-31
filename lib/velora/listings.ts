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
      status: "active",
      published_at: new Date().toISOString(),
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
    const extension = blob.type === "image/png" ? "png" : blob.type === "image/webp" ? "webp" : "jpg";
    const path = `${user.id}/${listing.id}/${String(index + 1).padStart(2, "0")}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("listing-images")
      .upload(path, blob, { contentType: blob.type, upsert: false });

    if (uploadError) {
      if (uploadedPaths.length) await supabase.storage.from("listing-images").remove(uploadedPaths);
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
