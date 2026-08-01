import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../../lib/admin-auth";
import { matterhornRequest } from "../../../../../lib/matterhorn";

type MatterhornCategory = Record<string, unknown> & { id?: string | number; category_id?: string | number; name?: string; category_name?: string };

export const dynamic = "force-dynamic";

function categoryList(payload: unknown): MatterhornCategory[] {
  if (Array.isArray(payload)) return payload as MatterhornCategory[];
  if (!payload || typeof payload !== "object") return [];
  const record = payload as Record<string, unknown>;
  for (const key of ["categories", "items", "data", "results", "CATEGORIES"]) {
    if (Array.isArray(record[key])) return record[key] as MatterhornCategory[];
  }
  return [];
}

export async function GET() {
  try {
    if (!(await requireAdmin())) return NextResponse.json({ error: "Nuk ke qasje." }, { status: 403 });
    const payload = await matterhornRequest<unknown>("/DICTIONARIES/CATEGORIES");
    const source = categoryList(payload);
    const categories = source
      .map(category => ({
        id: String(category.id ?? category.category_id ?? ""),
        name: String(category.name ?? category.category_name ?? "Pa emër"),
        path: String(category.path ?? category.category_path ?? category.full_path ?? ""),
      }))
      .filter(category => category.id)
      .sort((a, b) => `${a.path} ${a.name}`.localeCompare(`${b.path} ${b.name}`));
    return NextResponse.json({ categories });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Kategoritë nuk mund të lexoheshin." }, { status: 500 });
  }
}
