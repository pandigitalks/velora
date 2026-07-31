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

  if (input.image?.startsWith("data:")) {
    const path = `${user.id}/${listing.id}/cover.jpg`;
    const { error: uploadError } = await supabase.storage
      .from("listing-images")
      .upload(path, dataUrlToBlob(input.image), {
        contentType: "image/jpeg",
        upsert: false,
      });

    if (uploadError) {
      await supabase.from("listings").delete().eq("id", listing.id);
      throw uploadError;
    }

    const { error: imageError } = await supabase
      .from("listing_images")
      .insert({ listing_id: listing.id, storage_path: path, sort_order: 0 });

    if (imageError) throw imageError;
  }

  return listing.id as string;
}
