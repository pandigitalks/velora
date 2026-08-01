export const MATTERHORN_BASE_URL = "https://matterhorn-wholesale.com/B2BAPI";
export const DEFAULT_SHIPPING_COST = 24;
export const MINIMUM_PROFIT = 8;

export type MatterhornVariant = {
  variant_uid: string | number;
  name: string;
  stock: string | number;
  max_processing_time?: string | number;
  ean?: string;
};

export type MatterhornProduct = {
  id: string | number;
  active?: string | boolean;
  name: string;
  name_without_number?: string;
  description?: string;
  creation_date?: string;
  color?: string;
  category_name?: string;
  category_id?: string | number;
  category_path?: string;
  brand_id?: string | number;
  brand?: string;
  stock_total?: string | number;
  url?: string;
  images?: string[];
  new_collection?: string;
  variants?: MatterhornVariant[];
  size_table?: string;
  size_table_txt?: string;
  size_table_html?: string;
  prices?: Record<string, number>;
};

export function sellingPrice(cost: number, shipping = DEFAULT_SHIPPING_COST, profit = MINIMUM_PROFIT) {
  return Math.round((cost + shipping + Math.max(MINIMUM_PROFIT, profit)) * 100) / 100;
}

export async function matterhornRequest<T>(path: string): Promise<T> {
  const apiKey = process.env.MATTERHORN_API_KEY;
  if (!apiKey) throw new Error("MATTERHORN_API_KEY nuk është konfiguruar në server.");
  const response = await fetch(`${MATTERHORN_BASE_URL}${path}`, {
    headers: { accept: "application/json", Authorization: apiKey },
    cache: "no-store",
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`Matterhorn API ${response.status}: ${await response.text()}`);
  return response.json() as Promise<T>;
}

export function matterhornCategorySlug(product: MatterhornProduct) {
  const value = `${product.category_path || ""} ${product.category_name || ""}`.toLowerCase();
  if (/sneaker|trainer|athletic/.test(value)) return "trainers-women";
  if (/shoe|boot|sandal|slipper|moccasin|loafer|pump|ballet/.test(value)) return "shoes-women";
  if (/handbag|\bbag\b|clutch/.test(value)) return "bags-women";
  if (/sunglass/.test(value)) return "sunglasses-women";
  if (/jewel/.test(value)) return "accessories-jewellery-women";
  if (/accessor|wallet|purse|belt|glove|scarf|shawl|hat|cap|sock/.test(value)) return "accessories-jewellery-women";
  if (/dress|gown/.test(value)) return "dresses";
  if (/blazer/.test(value)) return "blazers-women";
  if (/coat|jacket|vest/.test(value)) return "jackets-women";
  if (/skirt/.test(value)) return "skirts";
  if (/jean/.test(value)) return "jeans-women";
  if (/trouser|pants|legging/.test(value)) return "trousers-women";
  if (/short/.test(value)) return "shorts-bermudas-women";
  if (/sweater|jumper|cardigan|pullover|turtleneck|knit/.test(value)) return "cardigans-sweaters-women";
  if (/sweatshirt|tracksuit|sport/.test(value)) return "sweatshirts-joggers-women";
  if (/swim|beach/.test(value)) return "swimwear-women";
  if (/lingerie|underwear|bra|knicker|thong|corset|nightwear|pyjama|hosiery/.test(value)) return "lingerie";
  if (/shirt|blouse|tunic/.test(value)) return "shirts-women";
  if (/t-shirt|top|body/.test(value)) return "tops-bodies";
  return "women-clothing";
}

export function isExcludedLingerie(value: Pick<MatterhornProduct, "category_path" | "category_name" | "name"> | Record<string, unknown>) {
  const text = [
    value.category_path,
    value.category_name,
    value.name,
    value.path,
    value.full_path,
    value.parent_name,
  ].filter(Boolean).join(" ").toLowerCase();
  return /lingerie|underwear|nightwear|sleepwear|nightgown|pyjama|pajama|\bbra\b|knicker|panties|thong|corset|bodysuit|erotic|sexy|shapewear|hosiery|stocking|tights/.test(text);
}

export function safeImageUrl(value: string) {
  return value.startsWith("http://") ? `https://${value.slice(7)}` : value;
}

export function slugifyBrand(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
