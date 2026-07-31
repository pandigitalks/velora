import "server-only";
import { GoogleGenAI } from "@google/genai";
import type { Interactions } from "@google/genai";
import { z } from "zod";

export const MAX_AUTHENTICITY_IMAGES = 8;
export const MAX_AUTHENTICITY_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_AUTHENTICITY_TOTAL_BYTES = 50 * 1024 * 1024;
export const AUTHENTICITY_RATE_LIMIT_PER_HOUR = 5;
export const ALLOWED_AUTHENTICITY_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export const authenticityResultSchema = z.object({
  detected_brand: z.string().max(120),
  product_category: z.string().max(120),
  detected_model: z.string().max(180),
  visible_serial_number: z.string().max(180),
  authenticity_risk_score: z.number().int().min(0).max(100),
  confidence_score: z.number().int().min(0).max(100),
  classification: z.enum([
    "low_risk",
    "medium_risk",
    "high_risk",
    "insufficient_evidence",
  ]),
  positive_signals: z.array(z.string().max(500)).max(30),
  warning_signals: z.array(z.string().max(500)).max(30),
  missing_evidence: z.array(z.string().max(500)).max(30),
  required_additional_photos: z.array(z.string().max(500)).max(20),
  short_explanation_albanian: z.string().min(1).max(2000),
}).strict().superRefine((value, context) => {
  const score = value.authenticity_risk_score;
  const consistent = value.classification === "insufficient_evidence"
    || (value.classification === "low_risk" && score <= 20)
    || (value.classification === "medium_risk" && score >= 21 && score <= 50)
    || (value.classification === "high_risk" && score >= 51);
  if (!consistent) {
    context.addIssue({
      code: "custom",
      path: ["classification"],
      message: "Classification does not match the counterfeit risk score.",
    });
  }
});

export type AuthenticityResult = z.infer<typeof authenticityResultSchema>;

export const AUTHENTICITY_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "detected_brand", "product_category", "detected_model", "visible_serial_number",
    "authenticity_risk_score", "confidence_score", "classification",
    "positive_signals", "warning_signals", "missing_evidence",
    "required_additional_photos", "short_explanation_albanian",
  ],
  properties: {
    detected_brand: { type: "string" },
    product_category: { type: "string" },
    detected_model: { type: "string" },
    visible_serial_number: { type: "string" },
    authenticity_risk_score: { type: "integer", minimum: 0, maximum: 100 },
    confidence_score: { type: "integer", minimum: 0, maximum: 100 },
    classification: { type: "string", enum: ["low_risk", "medium_risk", "high_risk", "insufficient_evidence"] },
    positive_signals: { type: "array", items: { type: "string" } },
    warning_signals: { type: "array", items: { type: "string" } },
    missing_evidence: { type: "array", items: { type: "string" } },
    required_additional_photos: { type: "array", items: { type: "string" } },
    short_explanation_albanian: { type: "string" },
  },
} as const;

export const VELORA_AUTHENTICITY_SYSTEM_INSTRUCTION = `You are Velora AI Authenticity Check, a product authenticity risk-analysis system for a premium fashion marketplace.

Analyze all uploaded images as photographs of the same product.

Inspect:
- visible brand and product category
- logo typography, proportions, spacing and placement
- internal and external labels
- stitching, seams and construction quality
- materials and texture
- hardware, engravings, zippers, buttons and finishing
- serial numbers, model codes, barcodes and production codes
- packaging, dust bags, boxes and included accessories
- consistency between all uploaded photographs
- signs that photographs may be copied, edited or unrelated

Important rules:
- Never state that a product is 100% authentic.
- Never invent a serial number, model, material or brand-specific detail.
- Base the result only on visible evidence and reliable search findings.
- When evidence is insufficient, use "insufficient_evidence".
- The authenticity_risk_score means counterfeit risk:
  0–20 = low risk
  21–50 = medium risk
  51–100 = high risk
- The confidence_score represents confidence in the analysis, not authenticity.
- Write all explanations, signals and photo requests in Albanian.
- Return the answer only through the configured structured output.`;

function extractInteractionText(interaction: { output_text?: string; steps?: unknown[] }) {
  if (interaction.output_text) return interaction.output_text;
  const steps = interaction.steps ?? [];
  for (let index = steps.length - 1; index >= 0; index -= 1) {
    const step = steps[index] as { content?: unknown; text?: string };
    if (typeof step?.text === "string") return step.text;
    const content = step?.content as { text?: string } | undefined;
    if (typeof content?.text === "string") return content.text;
  }
  throw new Error("Gemini returned no structured response.");
}

export async function analyzeAuthenticity(images: File[]) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");

  const ai = new GoogleGenAI({ apiKey });
  const tools: Interactions.Tool[] = [{ type: "google_search" }];
  const imageContent: Interactions.ImageContent[] = await Promise.all(
    images.map(async (image) => ({
      type: "image" as const,
      mime_type: image.type,
      data: Buffer.from(await image.arrayBuffer()).toString("base64"),
    })),
  );

  const model = process.env.GEMINI_AUTHENTICITY_MODEL || "models/gemini-3.6-flash";
  const interaction = await ai.interactions.create({
    model,
    input: [
      { type: "text", text: "Analizo të gjitha fotografitë si prova të të njëjtit produkt dhe kthe vetëm rezultatin e strukturuar." },
      ...imageContent,
    ],
    system_instruction: VELORA_AUTHENTICITY_SYSTEM_INSTRUCTION,
    tools,
    response_format: {
      type: "text",
      mime_type: "application/json",
      schema: AUTHENTICITY_JSON_SCHEMA,
    },
    generation_config: {
      max_output_tokens: 65536,
      thinking_level: "medium",
    },
  });

  const parsedJson = JSON.parse(extractInteractionText(interaction));
  return { model, result: authenticityResultSchema.parse(parsedJson) };
}

export function requiresManualReview(result: AuthenticityResult) {
  return result.classification === "high_risk" || result.classification === "insufficient_evidence";
}

export async function hasValidImageSignature(file: File) {
  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  if (file.type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (file.type === "image/png") return bytes.slice(0, 8).every((byte, index) => byte === [137, 80, 78, 71, 13, 10, 26, 10][index]);
  if (file.type === "image/webp") {
    return String.fromCharCode(...bytes.slice(0, 4)) === "RIFF"
      && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  }
  return false;
}
