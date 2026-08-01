import "server-only";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import type { MatterhornProduct } from "../matterhorn";

const localizedProductSchema = z.object({
  title: z.string().min(1).max(240),
  description: z.string().max(8000),
  color: z.string().max(120),
  material: z.string().max(240),
}).strict();

export type LocalizedProduct = z.infer<typeof localizedProductSchema>;

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "description", "color", "material"],
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    color: { type: "string" },
    material: { type: "string" },
  },
} as const;

const entities: Record<string, string> = {
  "&nbsp;": " ", "&amp;": "&", "&quot;": "\"", "&#39;": "'", "&lt;": "<", "&gt;": ">",
};

export function cleanProductText(value?: string | null) {
  return (value || "")
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<\s*\/?\s*(p|div|li|ul|ol|h[1-6])\b[^>]*>/gi, "\n")
    .replace(/<[^>]*>/g, " ")
    .replace(/&(nbsp|amp|quot|#39|lt|gt);/gi, match => entities[match.toLowerCase()] || " ")
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const colorFallback: Record<string, string> = {
  black: "E zezë", white: "E bardhë", grey: "Gri", gray: "Gri", green: "E gjelbër",
  blue: "E kaltër", red: "E kuqe", pink: "Rozë", yellow: "E verdhë", brown: "Kafe",
  beige: "Bezhë", orange: "Portokalli", purple: "Vjollcë", multicolour: "Shumëngjyrëshe",
  multicolor: "Shumëngjyrëshe",
};

function fallback(product: MatterhornProduct): LocalizedProduct {
  const sizeDetails = cleanProductText(product.size_table_txt || product.size_table_html || product.size_table);
  const rawDescription = cleanProductText(product.description);
  const description = [rawDescription, sizeDetails ? `Detajet e madhësive dhe materialit:\n${sizeDetails}` : ""]
    .filter(Boolean).join("\n\n");
  const rawColor = cleanProductText(product.color);
  const color = colorFallback[rawColor.toLowerCase()] || rawColor;
  const materialMatches = [...sizeDetails.matchAll(/\b(cotton|polyester|elastane|viscose|wool|silk|leather)\s*(\d{1,3})?\s*%?/gi)];
  const materialMap: Record<string, string> = { cotton: "Pambuk", polyester: "Poliester", elastane: "Elastan", viscose: "Viskozë", wool: "Lesh", silk: "Mëndafsh", leather: "Lëkurë" };
  const material = materialMatches.map(match => `${materialMap[match[1].toLowerCase()] || match[1]}${match[2] ? ` ${match[2]}%` : ""}`).join(", ");
  return {
    title: cleanProductText(product.name_without_number || product.name),
    description,
    color,
    material,
  };
}

function extractText(interaction: { output_text?: string; steps?: unknown[] }) {
  if (interaction.output_text) return interaction.output_text;
  for (const rawStep of [...(interaction.steps || [])].reverse()) {
    const step = rawStep as { text?: string; content?: { text?: string } };
    if (typeof step.text === "string") return step.text;
    if (typeof step.content?.text === "string") return step.content.text;
  }
  throw new Error("Gemini nuk ktheu përkthim.");
}

export async function localizeMatterhornProduct(product: MatterhornProduct): Promise<LocalizedProduct> {
  const safe = fallback(product);
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || (!safe.title && !safe.description)) return safe;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const interaction = await ai.interactions.create({
      model: process.env.GEMINI_TRANSLATION_MODEL || process.env.GEMINI_AUTHENTICITY_MODEL || "models/gemini-3.6-flash",
      input: JSON.stringify(safe),
      system_instruction: `Je përkthyes profesional për CLOZER. Përkthe në shqip natyrale çdo tekst anglisht të produktit. Ruaj saktë brendin, modelin, numrat, përqindjet, intervalet dhe madhësitë. Mos shpik informacione. Mos përdor HTML ose Markdown. Përshkrimin strukturoje me rreshta të lexueshëm. Kthe vetëm objektin e strukturuar.`,
      response_format: { type: "text", mime_type: "application/json", schema },
      generation_config: { max_output_tokens: 3000, thinking_level: "low" },
    });
    const parsed = localizedProductSchema.parse(JSON.parse(extractText(interaction)));
    return {
      title: cleanProductText(parsed.title),
      description: cleanProductText(parsed.description),
      color: cleanProductText(parsed.color),
      material: cleanProductText(parsed.material),
    };
  } catch (error) {
    console.warn("[matterhorn/localize] Gemini fallback", error instanceof Error ? error.message : error);
    return safe;
  }
}

export function inferredSizes(product: MatterhornProduct) {
  const variantSizes = (product.variants || [])
    .filter(variant => Number(variant.stock) > 0)
    .map(variant => cleanProductText(variant.name))
    .filter(Boolean);
  if (variantSizes.length) return [...new Set(variantSizes)];
  const text = cleanProductText([product.description, product.size_table_txt, product.size_table_html].filter(Boolean).join("\n"));
  const matches = [...text.matchAll(/(?:size|madh[eë]sia)\s*[:.]?\s*([A-Z0-9]{1,4}(?:\s*[-–/]\s*[A-Z0-9]{1,4})?)/gi)]
    .map(match => match[1].replace(/\s+/g, ""));
  return [...new Set(matches)];
}
