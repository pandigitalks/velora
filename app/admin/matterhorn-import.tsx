"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Download, LoaderCircle, PackageSearch, RefreshCw } from "lucide-react";

type CatalogProduct = {
  id: string; name: string; name_without_number?: string; description?: string; brand?: string;
  category_name?: string; color?: string; stock_total?: number; images?: string[];
  variants?: { name: string; stock: number }[]; cost: number; final_price: number; imported: boolean;
};
type MatterhornCategory = { id: string; name: string; path: string };

const money = (value: number) => new Intl.NumberFormat("sq-AL", { style: "currency", currency: "EUR" }).format(value || 0);

async function readApiResponse(response: Response) {
  const body = await response.text();
  let payload: Record<string, any> = {};
  if (body) {
    try {
      payload = JSON.parse(body) as Record<string, any>;
    } catch {
      throw new Error(response.ok
        ? "Serveri ktheu një përgjigje të pavlefshme. Provo përsëri."
        : `Shërbimi nuk është i disponueshëm për momentin (HTTP ${response.status}).`);
    }
  }
  if (!response.ok) throw new Error(String(payload.error || `Kërkesa dështoi (HTTP ${response.status}).`));
  return payload;
}

export default function MatterhornImport() {
  const [items, setItems] = useState<CatalogProduct[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [shipping, setShipping] = useState(24);
  const [profit, setProfit] = useState(8);
  const [categories, setCategories] = useState<MatterhornCategory[]>([]);
  const [categoryId, setCategoryId] = useState("");

  const load = async (targetPage = page) => {
    setLoading(true); setMessage(""); setSelected([]);
    try {
      const categoryQuery = categoryId ? `&category_id=${encodeURIComponent(categoryId)}` : "";
      const response = await fetch(`/api/admin/matterhorn/catalog?page=${targetPage}&limit=30${categoryQuery}`, { cache: "no-store" });
      const payload = await readApiResponse(response);
      setItems(payload.items || []); setPage(targetPage);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Katalogu nuk u ngarkua."); }
    finally { setLoading(false); }
  };
  useEffect(() => {
    let active = true;
    const initialise = async () => {
      // Prioritise the catalogue and avoid parallel supplier requests, because
      // Matterhorn intermittently rejects concurrent calls with a text response.
      await load(1);
      if (!active) return;
      try {
        const response = await fetch("/api/admin/matterhorn/categories", { cache: "no-store" });
        const payload = await readApiResponse(response);
        if (active) setCategories(payload.categories || []);
      } catch {
        if (active) setCategories([]);
      }
    };
    void initialise();
    return () => { active = false; };
  }, []);
  useEffect(() => { if (categories.length) void load(1); }, [categoryId]);

  const shown = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query ? items.filter(item => `${item.name} ${item.brand} ${item.category_name}`.toLowerCase().includes(query)) : items;
  }, [items, search]);
  const selectable = shown.filter(item => !item.imported).map(item => item.id);
  const allSelected = selectable.length > 0 && selectable.every(id => selected.includes(id));
  const toggle = (id: string) => setSelected(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id]);

  const importSelected = async () => {
    if (!selected.length) return;
    setImporting(true); setMessage("");
    try {
      const response = await fetch("/api/admin/matterhorn/import", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selected, shipping, profit }),
      });
      const payload = await readApiResponse(response);
      const failures = (payload.results || []).filter((result: { status: string }) => result.status === "failed");
      setMessage(`${payload.imported} produkte u importuan te Clozer Shop.${failures.length ? ` ${failures.length} dështuan — provo përsëri.` : ""}`);
      setItems(current => current.map(item => selected.includes(item.id) && !failures.some((failure: { id: string }) => failure.id === item.id) ? { ...item, imported: true } : item));
      setSelected(failures.map((failure: { id: string }) => failure.id));
    } catch (error) { setMessage(error instanceof Error ? error.message : "Importi dështoi."); }
    finally { setImporting(false); }
  };

  return <section className="matterhorn-admin">
    <div className="matterhorn-head">
      <div><span>MATTERHORN WHOLESALE API</span><h2>Zgjidh produktet për Clozer Shop</h2><p>Produktet publikohen vetëm pasi t’i selektosh. Fotot, detajet, marka, madhësitë dhe stoku ruhen automatikisht.</p></div>
      <button onClick={() => void load(page + 1)} disabled={loading}><RefreshCw size={16}/> Produkte tjera</button>
    </div>
    <div className="matterhorn-pricing">
      <div><small>FORMULA E ÇMIMIT</small><strong>Furnitori + transporti + fitimi</strong><p>Shembull: 10 € + {shipping} € + {Math.max(8, profit)} € = {money(10 + shipping + Math.max(8, profit))}</p></div>
      <label>Transporti (€)<input type="number" min="0" step="0.5" value={shipping} onChange={event => setShipping(Math.max(0, Number(event.target.value)))}/></label>
      <label>Fitimi minimal (€)<input type="number" min="8" step="0.5" value={profit} onChange={event => setProfit(Math.max(8, Number(event.target.value)))}/></label>
    </div>
    <div className="matterhorn-toolbar">
      <label className="matterhorn-category-filter">
        <span>Kategoria</span>
        <select value={categoryId} onChange={event => setCategoryId(event.target.value)}>
          <option value="">Të gjitha kategoritë</option>
          {categories.map(category => <option key={category.id} value={category.id}>{category.path ? `${category.path} / ` : ""}{category.name}</option>)}
        </select>
      </label>
      <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Kërko sipas emrit, markës ose kategorisë…"/>
      <button onClick={() => setSelected(allSelected ? [] : selectable)}><Check size={15}/>{allSelected ? "Hiq të gjitha" : "Zgjidh faqen"}</button>
      <button className="import" disabled={!selected.length || importing} onClick={() => void importSelected()}>{importing ? <LoaderCircle className="spin"/> : <Download/>}{importing ? "Duke importuar…" : `Importo ${selected.length || ""}`}</button>
    </div>
    {message && <div className="matterhorn-message">{message}</div>}
    {loading ? <div className="matterhorn-loading"><LoaderCircle className="spin"/><p>Duke marrë katalogun nga Matterhorn…</p></div> : shown.length ? <div className="matterhorn-grid">
      {shown.map(item => {
        const checked = selected.includes(item.id);
        const finalPrice = Math.round((item.cost + shipping + Math.max(8, profit)) * 100) / 100;
        return <article key={item.id} className={`${checked ? "selected" : ""} ${item.imported ? "imported" : ""}`} onClick={() => !item.imported && toggle(item.id)}>
          <div className="matterhorn-image">{item.images?.[0] ? <img src={item.images[0].replace("http://", "https://")} alt={item.name}/> : <PackageSearch/>}<i>{item.imported ? <Check/> : checked ? <Check/> : null}</i>{item.imported && <b>IMPORTUAR</b>}</div>
          <div className="matterhorn-copy"><small>{item.brand || "PA MARKË"} · {item.category_name || "Pa kategori"}</small><h3>{item.name_without_number || item.name}</h3><p>{item.color || "—"} · stok {item.stock_total || 0}</p><div><span>Kosto <b>{money(item.cost)}</b></span><span>Çmimi CLOZER <strong>{money(finalPrice)}</strong></span></div></div>
        </article>;
      })}
    </div> : <div className="matterhorn-loading"><PackageSearch/><p>Nuk u gjet asnjë produkt në këtë faqe.</p></div>}
    <div className="matterhorn-pages"><button disabled={page <= 1 || loading} onClick={() => void load(page - 1)}><ChevronLeft/> Para</button><span>Grupi {page}</span><button disabled={loading} onClick={() => void load(page + 1)}>Produkte tjera <ChevronRight/></button></div>
  </section>;
}
