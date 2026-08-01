import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../../lib/admin-auth";
import { isExcludedLingerie, matterhornRequest } from "../../../../../lib/matterhorn";

type MatterhornCategory = Record<string, unknown> & { id?: string | number; category_id?: string | number; name?: string; category_name?: string };

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (!(await requireAdmin())) return NextResponse.json({ error: "Nuk ke qasje." }, { status: 403 });
    const payload = await matterhornRequest<MatterhornCategory[] | { categories?: MatterhornCategory[] }>("/DICTIONARIES/CATEGORIES");
    const source = Array.isArray(payload) ? payload : payload.categories || [];
    const categories = source
      .filter(category => !isExcludedLingerie(category))
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
