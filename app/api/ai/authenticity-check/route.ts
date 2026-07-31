import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "../../../../lib/supabase/server";
import { createAdminSupabaseClient } from "../../../../lib/supabase/admin";
import {
  ALLOWED_AUTHENTICITY_IMAGE_TYPES,
  AUTHENTICITY_RATE_LIMIT_PER_HOUR,
  MAX_AUTHENTICITY_IMAGE_BYTES,
  MAX_AUTHENTICITY_IMAGES,
  MAX_AUTHENTICITY_TOTAL_BYTES,
  analyzeAuthenticity,
  hasValidImageSignature,
  requiresManualReview,
} from "../../../../lib/ai/authenticity";

export const runtime = "nodejs";
export const maxDuration = 60;

const listingIdSchema = z.string().uuid();

function error(message: string, status: number, retryAfter?: number) {
  return NextResponse.json(
    { error: message },
    { status, headers: retryAfter ? { "Retry-After": String(retryAfter) } : undefined },
  );
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
    const userId = claimsData?.claims?.sub;
    if (claimsError || !userId) return error("Duhet të kyçesh për analizën AI.", 401);

    const contentType = request.headers.get("content-type") || "";
    if (!contentType.toLowerCase().startsWith("multipart/form-data")) {
      return error("Kërkesa duhet të përmbajë fotografi.", 415);
    }

    const formData = await request.formData();
    const listingIdResult = listingIdSchema.safeParse(formData.get("listing_id"));
    if (!listingIdResult.success) return error("Listing ID nuk është valid.", 400);
    const listingId = listingIdResult.data;

    const images = formData.getAll("images").filter((item): item is File => item instanceof File);
    if (images.length < 1 || images.length > MAX_AUTHENTICITY_IMAGES) {
      return error(`Ngarko 1 deri në ${MAX_AUTHENTICITY_IMAGES} fotografi.`, 400);
    }

    let totalBytes = 0;
    for (const image of images) {
      totalBytes += image.size;
      if (!ALLOWED_AUTHENTICITY_IMAGE_TYPES.has(image.type)) {
        return error("Lejohen vetëm JPG, JPEG, PNG ose WEBP.", 415);
      }
      if (image.size < 1 || image.size > MAX_AUTHENTICITY_IMAGE_BYTES) {
        return error("Secila fotografi duhet të jetë deri në 10 MB.", 413);
      }
      if (!(await hasValidImageSignature(image))) {
        return error("Një skedar nuk është fotografi valide ose tipi i tij është ndryshuar.", 415);
      }
    }
    if (totalBytes > MAX_AUTHENTICITY_TOTAL_BYTES) {
      return error("Fotografitë së bashku nuk mund të kalojnë 50 MB.", 413);
    }

    const { data: listing } = await supabase
      .from("listings")
      .select("id,seller_id")
      .eq("id", listingId)
      .eq("seller_id", userId)
      .maybeSingle();
    if (!listing) return error("Nuk u gjet shpallja jote.", 404);

    const admin = createAdminSupabaseClient();
    const windowStart = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count, error: countError } = await admin
      .from("ai_authenticity_request_log")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", windowStart);
    if (countError) throw countError;
    if ((count ?? 0) >= AUTHENTICITY_RATE_LIMIT_PER_HOUR) {
      return error("Ke arritur limitin e analizave. Provo përsëri pas një ore.", 429, 3600);
    }

    const { error: logError } = await admin
      .from("ai_authenticity_request_log")
      .insert({ user_id: userId, listing_id: listingId });
    if (logError) throw logError;

    const { model, result } = await analyzeAuthenticity(images);
    const manualReview = requiresManualReview(result);
    const status = manualReview ? "manual_review" : "ai_review";
    const reviewStatus = manualReview ? "manual_review_required" : "ai_completed";
    const analyzedAt = new Date().toISOString();

    const { error: saveError } = await admin.from("authenticity_checks").insert({
      listing_id: listingId,
      requested_by: userId,
      status,
      confidence: result.confidence_score,
      risk_score: result.authenticity_risk_score,
      classification: result.classification,
      risk_flags: result.warning_signals,
      analysis: result,
      model,
      review_status: reviewStatus,
      analyzed_at: analyzedAt,
    });
    if (saveError) throw saveError;

    const { error: listingError } = await admin
      .from("listings")
      .update({ authenticity_status: status })
      .eq("id", listingId);
    if (listingError) throw listingError;

    return NextResponse.json(result, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (caught) {
    console.error("CLOZER authenticity analysis failed", caught);
    return error("Analiza AI nuk u përfundua. Provo përsëri.", 500);
  }
}
