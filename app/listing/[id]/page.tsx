import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Marketplace from "../../marketplace-v2";
import { createServerSupabaseClient } from "../../../lib/supabase/server";

type PageProps = { params: Promise<{ id: string }> };

type ListingMetadataRow = {
  title: string;
  description: string;
  price: number | string;
  currency: string;
  condition: string;
  brand: { name: string } | null;
  listing_images: Array<{ storage_path: string; sort_order: number }>;
};

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );

async function getListing(id: string): Promise<ListingMetadataRow | null> {
  if (!isUuid(id)) return null;
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("listings")
    .select(
      "title,description,price,currency,condition,brand:brands(name),listing_images(storage_path,sort_order)",
    )
    .eq("id", id)
    .eq("status", "active")
    .maybeSingle();
  return data as unknown as ListingMetadataRow | null;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListing(id);
  const demo =
    id === "27"
      ? {
          title: "Pallto leshi e strukturuar",
          description: "Pjesë premium e përzgjedhur në CLOZER.",
          image: "/assets/editorial-luxury.webp",
        }
      : null;
  const title = listing?.title || demo?.title || "Produkt në CLOZER";
  const description =
    listing?.description ||
    demo?.description ||
    "Shiko detajet, gjendjen, dërgesën dhe statusin e kontrollit të këtij produkti në CLOZER.";
  let image = demo?.image;
  if (listing?.listing_images?.length) {
    const supabase = await createServerSupabaseClient();
    const first = [...listing.listing_images].sort(
      (a, b) => a.sort_order - b.sort_order,
    )[0];
    image = supabase.storage
      .from("listing-images")
      .getPublicUrl(first.storage_path).data.publicUrl;
  }
  return {
    title: `${title} — CLOZER`,
    description,
    alternates: { canonical: `/listing/${id}` },
    openGraph: {
      title,
      description,
      type: "website",
      images: image ? [{ url: image, alt: title }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : [],
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const listing = await getListing(id);
  const numericId = /^\d+$/.test(id) ? Number(id) : null;
  if (
    (isUuid(id) && !listing) ||
    (numericId !== null && (numericId < 1 || numericId > 27)) ||
    (!isUuid(id) && numericId === null)
  ) {
    notFound();
  }
  const structured = listing
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: listing.title,
        description: listing.description,
        brand: listing.brand?.name
          ? { "@type": "Brand", name: listing.brand.name }
          : undefined,
        itemCondition: listing.condition,
        offers: {
          "@type": "Offer",
          price: Number(listing.price),
          priceCurrency: listing.currency,
          availability: "https://schema.org/InStock",
          url: `/listing/${id}`,
        },
      }
    : null;
  return (
    <>
      {structured && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structured).replace(/</g, "\\u003c"),
          }}
        />
      )}
      <Marketplace />
    </>
  );
}
