"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "../../lib/supabase/client";
import {
  Activity, BadgeCheck, Boxes, ChevronDown, CircleDollarSign,
  Command, FileCheck2, Gauge, LayoutDashboard, Menu, MessageSquare,
  MoreHorizontal, PackageCheck, Search, Settings, ShieldCheck, ShoppingBag, Download, RefreshCw, SlidersHorizontal,
  Sparkles, TrendingUp, Users, X, Newspaper, Plus, Pencil, Trash2,
  Gift, Power, Trophy, Copy, Share2,
  PackagePlus,
} from "lucide-react";
import "./admin.css";
import MatterhornImport from "./matterhorn-import";

type Row = Record<string, any>;
type Snapshot = {
  generated_at: string;
  metrics: Record<string, number>;
  trends: { day: string; users: number; listings: number; orders: number; revenue: number }[];
  users: Row[]; listings: Row[]; orders: Row[]; messages: Row[];
  authenticity: Row[]; categories: Row[]; brands: Row[];
};

const sections = [
  ["overview", "Pasqyra", LayoutDashboard], ["users", "Përdoruesit", Users],
  ["seller-applications", "Aplikimet e shitësve", FileCheck2],
  ["listings", "Listimet", ShoppingBag], ["orders", "Porositë", PackageCheck],
  ["messages", "Mesazhet", MessageSquare], ["authenticity", "Autenticiteti", ShieldCheck],
  ["catalog", "Katalogu", Boxes], ["blog", "Blogu", Newspaper], ["waitlist", "Waitlist", Gift], ["activity", "Aktiviteti", Activity], ["settings", "Konfigurimi", Settings],
  ["matterhorn", "Importi Matterhorn", PackagePlus],
] as const;

const money = (value: number) => new Intl.NumberFormat("sq-AL", { style: "currency", currency: "EUR" }).format(value || 0);
const date = (value?: string) => value ? new Intl.DateTimeFormat("sq-AL", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value)) : "—";
const label = (value?: string) => (value || "—").replaceAll("_", " ");

export default function AdminDashboard({ initialData, initialModerationQueue, initialSellerApplications, initialBlogPosts, initialWaitlist, initialSiteSettings, admin }: { initialData: Snapshot; initialModerationQueue: Row[]; initialSellerApplications: Row[]; initialBlogPosts: Row[]; initialWaitlist: Row[]; initialSiteSettings: Row; admin: Row }) {
  const [active, setActive] = useState("overview");
  const [query, setQuery] = useState("");
  const [sidebar, setSidebar] = useState(false);
  const [moderationQueue, setModerationQueue] = useState(initialModerationQueue);
  const [sellerApplications, setSellerApplications] = useState(initialSellerApplications);
  const [moderating, setModerating] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Row | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const data = initialData;
  const m = data.metrics || {};
  const title = sections.find(([id]) => id === active)?.[1] || "Pasqyra";

  const rows = useMemo(() => {
    const source = active === "catalog" ? [...(data.categories || []), ...(data.brands || [])] : active === "seller-applications" ? sellerApplications : ((data as any)[active] || []);
    const filtered = statusFilter === "all" ? source : source.filter((row: Row) => String(row.status || "").toLowerCase() === statusFilter);
    if (!query.trim()) return filtered;
    const q = query.toLowerCase();
    return filtered.filter((row: Row) => JSON.stringify(row).toLowerCase().includes(q));
  }, [active, data, query, sellerApplications, statusFilter]);
  const refresh = () => { setRefreshing(true); window.setTimeout(() => window.location.reload(), 250); };
  const exportCsv = () => { const exportRows = rows as Row[]; const columns: string[] = Array.from(new Set(exportRows.flatMap((row: Row) => Object.keys(row)))); const csv = [columns.join(","), ...exportRows.map((row: Row) => columns.map((key: string) => JSON.stringify(row[key] ?? "")).join(","))].join("\n"); const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([csv], {type:"text/csv"})); link.download = `clozer-${active}.csv`; link.click(); URL.revokeObjectURL(link.href); };

  return <div className="admin-shell">
    <aside className={`admin-sidebar ${sidebar ? "is-open" : ""}`}>
      <div className="admin-brand"><span>V</span><div>CLOZER<small>COMMAND CENTER</small></div><button onClick={() => setSidebar(false)}><X size={19}/></button></div>
      <nav>
        <p>OPERACIONET</p>
        {sections.map(([id, text, Icon]) => <button key={id} className={active === id ? "active" : ""} onClick={() => { setActive(id); setSidebar(false); }}><Icon size={18}/><span>{text}</span>{id === "listings" && moderationQueue.length > 0 ? <b>{moderationQueue.length}</b> : id === "seller-applications" && sellerApplications.length > 0 ? <b>{sellerApplications.length}</b> : id === "authenticity" && m.pending_authenticity > 0 ? <b>{m.pending_authenticity}</b> : null}</button>)}
        <p>SISTEMI</p>
        <button className={active === "activity" ? "active" : ""} onClick={() => setActive("activity")}><Activity size={18}/><span>Aktiviteti</span></button>
        <button className={active === "settings" ? "active" : ""} onClick={() => setActive("settings")}><Settings size={18}/><span>Konfigurimi</span></button>
      </nav>
      <div className="admin-user"><div className="avatar">{admin.avatar_url ? <img src={admin.avatar_url} alt={admin.full_name || "Clozer Shop"}/> : (admin.full_name || admin.username || "A")[0]}</div><div><strong>{admin.full_name || admin.username || "Administrator"}</strong><small>Super Admin</small></div><ChevronDown size={16}/></div>
    </aside>
    {sidebar && <button aria-label="Mbyll menynë" className="sidebar-scrim" onClick={() => setSidebar(false)}/>} 
    <main className="admin-main">
      <header className="admin-topbar">
        <button className="mobile-menu" onClick={() => setSidebar(true)}><Menu/></button>
        <div className="admin-search"><Search size={18}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Kërko në tërë platformën..."/><kbd>⌘ K</kbd></div>
        <div className="top-actions"><button aria-label="Rifresko panelin" onClick={refresh} disabled={refreshing}><RefreshCw size={19}/></button><Link href="/">Shiko faqen</Link></div>
      </header>
      <div className="admin-content">
        <div className="page-heading"><div><p><Command size={14}/> ADMIN / {active.toUpperCase()}</p><h1>{title}</h1><span>Kontroll i plotë dhe të dhëna në kohë reale për Clozer.</span></div><div className="live"><i/> LIVE <small>Përditësuar {new Date(data.generated_at).toLocaleTimeString("sq-AL", {hour:"2-digit",minute:"2-digit"})}</small></div></div>
        {notice && <div className="moderation-notice">{notice}</div>}
        {active === "overview" ? <Overview data={data} /> : active === "matterhorn" ? <MatterhornImport /> : active === "activity" ? <ActivityPanel data={data} /> : active === "settings" ? <SettingsPanel /> : active === "waitlist" ? <WaitlistManager initialEntries={initialWaitlist} initialSettings={initialSiteSettings} query={query} /> : active === "blog" ? <BlogManager initialPosts={initialBlogPosts} query={query} /> : active === "seller-applications" ? <SellerApplications rows={rows} busy={moderating} onReview={async (application, decision) => {
          const note = decision === "rejected" ? window.prompt("Shkruaj arsyen e refuzimit:")?.trim() || "" : "";
          if (decision === "rejected" && !note) return;
          setModerating(application.user_id);
          setNotice("");
          const { error } = await createClient().rpc("review_seller_application", { target_user_id: application.user_id, decision, review_note: note || null });
          setModerating(null);
          if (error) { setNotice(`Gabim: ${error.message}`); return; }
          setSellerApplications(current => current.filter(item => item.user_id !== application.user_id));
          setNotice(decision === "approved" ? "Shitësi u aprovua dhe paneli u aktivizua." : "Aplikimi u refuzua.");
        }} /> : <DataSection type={active} rows={rows} query={query} moderationQueue={moderationQueue} moderating={moderating} filterOpen={filterOpen} statusFilter={statusFilter} setFilterOpen={setFilterOpen} setStatusFilter={setStatusFilter} onExport={exportCsv} onSelect={setSelected} onModerate={async (listing, status) => {
          let note = "";
          if (status !== "active") {
            note = window.prompt(status === "changes_requested" ? "Çfarë duhet të ndryshojë shitësi?" : "Shkruaj arsyen e refuzimit:")?.trim() || "";
            if (!note) return;
          }
          setModerating(listing.id);
          setNotice("");
          const { error } = await createClient().from("listings").update({ status, moderation_note: note || null }).eq("id", listing.id);
          setModerating(null);
          if (error) { setNotice(`Gabim: ${error.message}`); return; }
          setModerationQueue(current => current.filter(item => item.id !== listing.id));
          setNotice(status === "active" ? "Produkti u aprovua dhe u publikua." : status === "changes_requested" ? "Kërkesa për ndryshime iu dërgua shitësit." : "Produkti u refuzua dhe shitësi u njoftua.");
        }} />}{selected && <ActionPanel row={selected} type={active} onClose={() => setSelected(null)} onDone={(message) => {setNotice(message); setSelected(null); refresh();}} />}
      </div>
    </main>
  </div>;
}

function SellerApplications({ rows, busy, onReview }: { rows: Row[]; busy: string | null; onReview: (application: Row, decision: "approved" | "rejected") => Promise<void> }) {
  return <section className="panel moderation-panel"><div className="moderation-heading"><div><span>APLIKIMET E SHITËSVE</span><h2>{rows.length} aplikime në pritje</h2><p>Kontrollo të dhënat para aktivizimit të panelit të shitësit.</p></div><Users/></div>{rows.length ? <div className="seller-application-admin">{rows.map(row => <article key={row.user_id}><div><span className="status">{row.seller_type === "business" ? "Biznes" : "Individual"}</span><h3>{row.display_name}</h3><p>{row.phone} · {row.city}</p>{row.note && <small>{row.note}</small>}<em>{date(row.created_at)}</em></div><div className="moderation-actions"><button className="approve" disabled={busy === row.user_id} onClick={() => void onReview(row,"approved")}><BadgeCheck/> Aprovo</button><button className="reject" disabled={busy === row.user_id} onClick={() => void onReview(row,"rejected")}><X/> Refuzo</button></div></article>)}</div> : <div className="empty compact"><BadgeCheck/><h3>Nuk ka aplikime në pritje</h3><p>Aplikimet e reja do të shfaqen këtu.</p></div>}</section>;
}

const emptyBlogPost = { id: "", title: "", slug: "", category: "EDITORIAL", cover_image: "", excerpt: "", content: "", status: "draft", featured: false, published_at: null };
const blogSlug = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function BlogManager({ initialPosts, query }: { initialPosts: Row[]; query: string }) {
  const [posts, setPosts] = useState(initialPosts);
  const [draft, setDraft] = useState<Row | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? posts.filter(post => JSON.stringify(post).toLowerCase().includes(q)) : posts;
  }, [posts, query]);

  const begin = (post?: Row) => {
    setDraft(post ? { ...post } : { ...emptyBlogPost });
    setSlugTouched(Boolean(post));
    setMessage("");
  };
  const change = (field: string, value: unknown) => setDraft(current => current ? { ...current, [field]: value } : current);
  const save = async () => {
    if (!draft) return;
    const slug = blogSlug(draft.slug || draft.title);
    if (!draft.title.trim() || !slug || !draft.excerpt.trim() || !draft.content.trim()) {
      setMessage("Plotëso titullin, përmbledhjen dhe përmbajtjen e artikullit.");
      return;
    }
    setBusy(true);
    setMessage("");
    const payload = {
      title: draft.title.trim(), slug, category: draft.category.trim() || "EDITORIAL",
      cover_image: draft.cover_image.trim() || "/assets/blazer-one.webp",
      excerpt: draft.excerpt.trim(), content: draft.content.trim(), status: draft.status,
      featured: Boolean(draft.featured),
      published_at: draft.status === "published" ? (draft.published_at || new Date().toISOString()) : null,
    };
    const client = createClient();
    const request = draft.id
      ? client.from("blog_posts").update(payload).eq("id", draft.id).select().single()
      : client.from("blog_posts").insert(payload).select().single();
    const { data, error } = await request;
    setBusy(false);
    if (error) { setMessage(`Gabim: ${error.message}`); return; }
    setPosts(current => draft.id ? current.map(post => post.id === data.id ? data : post) : [data, ...current]);
    setDraft(null);
    setMessage(draft.id ? "Artikulli u përditësua." : "Artikulli u krijua.");
  };
  const remove = async (post: Row) => {
    if (!window.confirm(`Ta fshijmë artikullin “${post.title}”? Ky veprim nuk kthehet.`)) return;
    setBusy(true);
    setMessage("");
    const { error } = await createClient().from("blog_posts").delete().eq("id", post.id);
    setBusy(false);
    if (error) { setMessage(`Gabim: ${error.message}`); return; }
    setPosts(current => current.filter(item => item.id !== post.id));
    setMessage("Artikulli u fshi.");
  };

  return <section className="blog-admin">
    <div className="blog-admin-head"><div><span>MENAXHIMI I PËRMBAJTJES</span><h2>{posts.length} artikuj</h2><p>Krijo, edito, publiko ose fshij artikujt që shfaqen te CLOZER Stories.</p></div><button className="blog-primary" onClick={() => begin()}><Plus size={16}/> Artikull i ri</button></div>
    {message && <div className="moderation-notice">{message}</div>}
    {draft && <div className="blog-editor panel">
      <div className="blog-editor-title"><div><span>{draft.id ? "EDITO ARTIKULLIN" : "ARTIKULL I RI"}</span><h3>{draft.id ? draft.title : "Përgatit një histori të re"}</h3></div><button aria-label="Mbyll editorin" onClick={() => setDraft(null)}><X/></button></div>
      <div className="blog-form-grid">
        <label className="blog-field full">Titulli<input value={draft.title} onChange={e => { change("title", e.target.value); if (!slugTouched) change("slug", blogSlug(e.target.value)); }}/></label>
        <label className="blog-field">Slug<input value={draft.slug} onChange={e => { setSlugTouched(true); change("slug", blogSlug(e.target.value)); }}/><small>/stories/{draft.slug || "slug-i-artikullit"}</small></label>
        <label className="blog-field">Kategoria<input value={draft.category} onChange={e => change("category", e.target.value.toUpperCase())}/></label>
        <label className="blog-field full">Fotografia kryesore<input value={draft.cover_image} onChange={e => change("cover_image", e.target.value)} placeholder="/assets/foto.webp ose https://..."/></label>
        <label className="blog-field full">Përmbledhja<textarea rows={3} value={draft.excerpt} onChange={e => change("excerpt", e.target.value)}/></label>
        <label className="blog-field full">Përmbajtja<textarea rows={12} value={draft.content} onChange={e => change("content", e.target.value)} placeholder="Ndaji paragrafët me një rresht bosh."/></label>
        <label className="blog-field">Statusi<select value={draft.status} onChange={e => change("status", e.target.value)}><option value="draft">Draft</option><option value="published">Publikuar</option></select></label>
        <label className="blog-check"><input type="checkbox" checked={Boolean(draft.featured)} onChange={e => change("featured", e.target.checked)}/> Shfaqe si artikull kryesor</label>
      </div>
      <div className="blog-editor-actions"><button onClick={() => setDraft(null)}>Anulo</button><button className="blog-primary" disabled={busy} onClick={() => void save()}>{busy ? "Duke ruajtur..." : "Ruaj artikullin"}</button></div>
    </div>}
    <div className="blog-admin-grid">{shown.map(post => <article className="blog-admin-card" key={post.id}><div className="blog-admin-cover">{post.cover_image ? <img src={post.cover_image} alt=""/> : <Newspaper/>}<span className={`status ${post.status === "published" ? "ok" : ""}`}>{post.status === "published" ? "Publikuar" : "Draft"}</span></div><div className="blog-admin-copy"><small>{post.category} · {date(post.published_at || post.created_at)}</small><h3>{post.title}</h3><p>{post.excerpt}</p><div className="blog-admin-actions"><button onClick={() => begin(post)}><Pencil/> Edito</button><button className="delete" disabled={busy} onClick={() => void remove(post)}><Trash2/> Fshij</button>{post.status === "published" && <Link href={`/stories/${post.slug}`} target="_blank">Shiko</Link>}</div></div></article>)}</div>
    {!shown.length && <div className="empty panel"><div><Newspaper/></div><h3>Nuk u gjet asnjë artikull</h3><p>Krijo artikullin e parë ose ndrysho kërkimin.</p></div>}
  </section>;
}

function Overview({ data }: { data: Snapshot }) {
  const m = data.metrics || {};
  const cards = [
    ["Të ardhura totale", money(m.revenue), `GMV ${money(m.gmv)}`, CircleDollarSign, "emerald"],
    ["Përdorues", m.users || 0, `${m.verified_sellers || 0} shitës të verifikuar`, Users, "violet"],
    ["Listime aktive", m.active_listings || 0, `${m.pending_listings || 0} në pritje`, ShoppingBag, "blue"],
    ["Porosi", m.orders || 0, `${m.open_orders || 0} aktive`, PackageCheck, "amber"],
  ] as const;
  const max = Math.max(1, ...(data.trends || []).map(x => x.users + x.listings + x.orders));
  return <>
    <section className="metric-grid">{cards.map(([title, value, note, Icon, tone]) => <article className="metric" key={title}><div className={`metric-icon ${tone}`}><Icon/></div><div className="metric-meta"><span>{title}</span><strong>{value}</strong><small><TrendingUp size={13}/>{note}</small></div><button><MoreHorizontal/></button></article>)}</section>
    <section className="dashboard-grid">
      <article className="panel chart-panel"><PanelTitle icon={Gauge} title="Rritja e platformës" subtitle="Aktiviteti gjatë 14 ditëve të fundit"/><div className="chart-legend"><span><i className="c-users"/> Përdorues</span><span><i className="c-listings"/> Listime</span><span><i className="c-orders"/> Porosi</span></div><div className="bar-chart">{(data.trends || []).map((x, i) => <div className="bar-column" key={x.day} title={`${x.day}: ${x.users} përdorues, ${x.listings} listime, ${x.orders} porosi`}><div className="bars"><i className="b-users" style={{height:`${Math.max(3,x.users/max*100)}%`}}/><i className="b-listings" style={{height:`${Math.max(3,x.listings/max*100)}%`}}/><i className="b-orders" style={{height:`${Math.max(3,x.orders/max*100)}%`}}/></div>{i % 2 === 0 && <small>{new Date(x.day).toLocaleDateString("sq-AL", {day:"numeric",month:"short"})}</small>}</div>)}</div></article>
      <article className="panel health"><PanelTitle icon={Activity} title="Shëndeti i platformës" subtitle="Statusi operacional"/><Health label="Autenticitet në pritje" value={m.pending_authenticity || 0} tone="amber"/><Health label="Mesazhe pa lexuar" value={m.unread_messages || 0} tone="violet"/><Health label="Mosmarrëveshje" value={m.disputes || 0} tone="red"/><Health label="Shkalla e aprovimit" value={`${m.approval_rate || 100}%`} tone="green"/></article>
    </section>
    <section className="dashboard-grid lower"><article className="panel"><PanelTitle icon={ShoppingBag} title="Listimet e fundit" subtitle="Përmbajtja më e re në marketplace"/><MiniTable rows={data.listings || []} type="listings"/></article><article className="panel"><PanelTitle icon={Sparkles} title="Aktiviteti i fundit" subtitle="Ngjarjet kryesore të sistemit"/><ActivityFeed data={data}/></article></section>
  </>;
}

function PanelTitle({ icon: Icon, title, subtitle }: any) { return <div className="panel-title"><div><Icon size={18}/><span><strong>{title}</strong><small>{subtitle}</small></span></div><button><MoreHorizontal/></button></div>; }
function Health({ label: text, value, tone }: any) { return <div className="health-row"><span><i className={tone}/>{text}</span><strong>{value}</strong></div>; }

function DataSection({ type, rows, moderationQueue = [], moderating, onModerate, filterOpen, statusFilter, setFilterOpen, setStatusFilter, onExport, onSelect }: { type: string; rows: Row[]; query: string; moderationQueue?: Row[]; moderating?: string | null; onModerate?: (listing: Row, status: "active" | "changes_requested" | "rejected") => Promise<void>; filterOpen:boolean; statusFilter:string; setFilterOpen:(v:boolean)=>void; setStatusFilter:(v:string)=>void; onExport:()=>void; onSelect:(r:Row)=>void }) {
  const descriptions: Record<string,string> = { users:"Llogaritë, verifikimet dhe aktiviteti", listings:"Moderimi dhe inventari i marketplace-it", orders:"Pagesat, dërgesat dhe mosmarrëveshjet", messages:"Komunikimi dhe siguria e komunitetit", authenticity:"Radha e kontrolleve të autenticitetit", catalog:"Kategoritë dhe markat e platformës" };
  return <>{type === "listings" && <ModerationQueue rows={moderationQueue} busy={moderating} onModerate={onModerate!}/>}<section className="panel data-panel"><div className="data-toolbar"><div><h2>{rows.length} rezultate</h2><p>{descriptions[type]}</p></div><div><button onClick={() => setFilterOpen(!filterOpen)}><SlidersHorizontal size={16}/> Filtro</button><button className="primary" onClick={onExport}><Download size={16}/> Eksporto CSV</button></div></div>{filterOpen && <div className="admin-filters"><label>Statusi<select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="all">Të gjitha</option><option value="pending">Në pritje</option><option value="pending_review">Në shqyrtim</option><option value="changes_requested">Ndryshime</option><option value="active">Aktive</option><option value="rejected">Refuzuar</option></select></label><button onClick={() => setStatusFilter("all")}>Pastro</button></div>}<MiniTable rows={rows} type={type} onSelect={onSelect}/></section></>;
}

function ModerationQueue({ rows, busy, onModerate }: { rows: Row[]; busy?: string | null; onModerate: (listing: Row, status: "active" | "changes_requested" | "rejected") => Promise<void> }) {
  return <section className="panel moderation-panel"><div className="moderation-heading"><div><span>RADHA E MODERIMIT</span><h2>{rows.length} produkte në pritje</h2><p>Kontrollo fotografitë dhe të dhënat para publikimit.</p></div><ShieldCheck/></div>{rows.length ? <div className="moderation-grid">{rows.map(row => { const seller = Array.isArray(row.seller) ? row.seller[0] : row.seller; const image = [...(row.listing_images || [])].sort((a,b) => a.sort_order-b.sort_order)[0]; const publicUrl = image?.storage_path && process.env.NEXT_PUBLIC_SUPABASE_URL ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/listing-images/${image.storage_path.split("/").map(encodeURIComponent).join("/")}` : ""; return <article key={row.id}><div className="moderation-image">{publicUrl ? <img src={publicUrl} alt={row.title}/> : <ShoppingBag/>}</div><div className="moderation-copy"><span className="status">{label(row.status)}</span><h3>{row.title}</h3><p>{seller?.full_name || seller?.username || "Shitës CLOZER"} · {row.category?.name_sq || "Pa kategori"}</p><strong>{money(Number(row.price))}</strong>{row.moderation_note && <small>{row.moderation_note}</small>}</div><div className="moderation-actions"><button disabled={busy === row.id} className="approve" onClick={() => void onModerate(row,"active")}><BadgeCheck/> Aprovo</button><button disabled={busy === row.id} onClick={() => void onModerate(row,"changes_requested")}>Kërko ndryshime</button><button disabled={busy === row.id} className="reject" onClick={() => void onModerate(row,"rejected")}>Refuzo</button></div></article>})}</div> : <div className="empty compact"><BadgeCheck/><h3>Radha është e pastër</h3><p>Nuk ka produkte që presin aprovim.</p></div>}</section>;
}

function MiniTable({ rows, type, onSelect }: { rows: Row[]; type: string; onSelect?: (row:Row)=>void }) {
  if (!rows.length) return <div className="empty"><div><FileCheck2/></div><h3>Gjithçka është gati</h3><p>Nuk ka ende të dhëna në këtë seksion. Të dhënat e reja do të shfaqen automatikisht.</p></div>;
  const fields: Record<string, [string,string][]> = {
    users:[["full_name","Përdoruesi"],["email","Email"],["created_at","Regjistruar"],["seller_verified","Verifikimi"]],
    listings:[["title","Listimi"],["seller_name","Shitësi"],["price","Çmimi"],["status","Statusi"],["created_at","Data"]],
    orders:[["id","Porosia"],["buyer_name","Blerësi"],["seller_name","Shitësi"],["total","Totali"],["status","Statusi"]],
    messages:[["sender_name","Dërguesi"],["body","Mesazhi"],["created_at","Data"],["read_at","Lexuar"]],
    authenticity:[["listing_title","Listimi"],["status","Statusi"],["confidence","Besueshmëria"],["created_at","Kërkuar"]],
    catalog:[["name","Emri"],["slug","Slug"],["kind","Lloji"],["is_active","Aktive"]],
  };
  const cols = fields[type] || fields.listings;
  return <div className="table-wrap"><table><thead><tr>{cols.map(([,h])=><th key={h}>{h}</th>)}<th/></tr></thead><tbody>{rows.slice(0,50).map((row,i)=><tr key={row.id || `${type}-${i}`}>{cols.map(([key])=><td key={key}>{renderCell(key,row[key],row)}</td>)}<td><button className="row-more" aria-label="Hap veprimet" onClick={() => onSelect?.(row)}><MoreHorizontal size={18}/></button></td></tr>)}</tbody></table></div>;
}

function ActivityPanel({data}:{data:Snapshot}) { return <section className="panel admin-detail"><PanelTitle icon={Activity} title="Aktiviteti i fundit" subtitle="Ngjarjet nga përdoruesit, listimet dhe porositë"/><ActivityFeed data={data}/></section>; }
function SettingsPanel() { return <section className="panel admin-detail"><PanelTitle icon={Settings} title="Konfigurimi i panelit" subtitle="Kontrollet kryesore të administrimit"/><p>Moderimi i listimeve dhe aplikimeve të shitësve bëhet nga seksionet përkatëse. Të dhënat rifreskohen vetëm kur shtyp butonin Rifresko, pa të larguar nga seksioni aktual.</p><p>Siguria e llogarive menaxhohet nga Supabase Auth; mbrojtja ndaj fjalëkalimeve të rrjedhura duhet aktivizuar në konfigurimin e Auth.</p></section>; }

function WaitlistManager({ initialEntries, initialSettings, query }: { initialEntries: Row[]; initialSettings: Row; query: string }) {
  const [entries, setEntries] = useState(initialEntries);
  const [enabled, setEnabled] = useState(Boolean(initialSettings.waitlist_enabled));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const referrals = useMemo(() => entries.reduce((map, entry) => ({ ...map, [entry.referred_by]: (map[entry.referred_by] || 0) + 1 }), {} as Record<string, number>), [entries]);
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? entries.filter(entry => JSON.stringify(entry).toLowerCase().includes(q)) : entries;
  }, [entries, query]);
  const toggle = async () => {
    setBusy(true); setMessage("");
    const next = !enabled;
    const { error } = await createClient().from("site_settings").update({ waitlist_enabled: next }).eq("id", "global");
    setBusy(false);
    if (error) { setMessage("Gabim: " + error.message); return; }
    setEnabled(next);
    setMessage(next ? "Waitlist-i u aktivizua. Homepage tani shfaq faqen e pritjes." : "Waitlist-i u çaktivizua. Homepage tani shfaq marketplace-in.");
  };
  const winner = async (entry: Row) => {
    const next = !entry.is_winner;
    setBusy(true); setMessage("");
    const { data, error } = await createClient().from("waitlist_entries").update({ is_winner: next, winner_value: next ? Number(initialSettings.waitlist_gift_value || 100) : null }).eq("id", entry.id).select().single();
    setBusy(false);
    if (error) { setMessage("Gabim: " + error.message); return; }
    setEntries(current => current.map(item => item.id === data.id ? data : item));
    setMessage(next ? entry.full_name + " u shënua si fitues." : "Statusi i fituesit u hoq.");
  };
  const copyEmails = async () => {
    await navigator.clipboard.writeText(entries.filter(entry => entry.status === "active").map(entry => entry.email).join(", "));
    setMessage("Email-et aktive u kopjuan.");
  };
  return <section className="waitlist-admin">
    <div className={"waitlist-control " + (enabled ? "is-on" : "")}>
      <div className="waitlist-control-icon"><Power/></div>
      <div><span>STATUSI I LANSMIT</span><h2>Waitlist {enabled ? "aktive" : "joaktive"}</h2><p>{enabled ? "Vizitorët në homepage shohin waitlist-in dhe mund të rezervojnë vendin." : "Vizitorët shohin marketplace-in normal. Regjistrimet e reja janë të mbyllura."}</p></div>
      <button onClick={() => void toggle()} disabled={busy} className="waitlist-toggle" role="switch" aria-checked={enabled}><i/><span>{enabled ? "ON" : "OFF"}</span></button>
    </div>
    {message && <div className="moderation-notice">{message}</div>}
    <div className="waitlist-stats">
      <article><Users/><span><small>REGJISTRIME</small><strong>{entries.length}</strong></span></article>
      <article><Gift/><span><small>HYRJE NË SHORT</small><strong>{entries.length + entries.filter(entry => entry.referred_by).length}</strong></span></article>
      <article><Share2/><span><small>REFERIME</small><strong>{entries.filter(entry => entry.referred_by).length}</strong></span></article>
      <article><Trophy/><span><small>FITUES</small><strong>{entries.filter(entry => entry.is_winner).length} / {initialSettings.waitlist_gift_cards || 3}</strong></span></article>
    </div>
    <div className="panel waitlist-table-panel">
      <div className="data-toolbar"><div><h2>{shown.length} persona</h2><p>Lista reale e qasjes së hershme dhe referimeve.</p></div><button onClick={() => void copyEmails()}><Copy size={15}/> Kopjo email-et</button></div>
      <div className="table-wrap"><table><thead><tr><th>#</th><th>Personi</th><th>Interesi</th><th>Referime</th><th>Hyrje</th><th>Data</th><th>Shorti</th></tr></thead><tbody>{shown.map(entry => <tr key={entry.id} className={entry.is_winner ? "winner-row" : ""}><td><strong>#{entry.position}</strong></td><td><div className="waitlist-person"><b>{entry.full_name}</b><small>{entry.email}{entry.phone ? " · " + entry.phone : ""}</small></div></td><td><span className="status ok">{entry.interest === "buyer" ? "Blerës" : entry.interest === "seller" ? "Shitës" : "Të dyja"}</span></td><td>{referrals[entry.id] || 0}</td><td><strong>{1 + (referrals[entry.id] || 0)}</strong></td><td>{date(entry.created_at)}</td><td><button className={"winner " + (entry.is_winner ? "active" : "")} disabled={busy} onClick={() => void winner(entry)}><Trophy size={14}/>{entry.is_winner ? "Fitues" : "Shëno"}</button></td></tr>)}</tbody></table></div>
      {!shown.length && <div className="empty compact"><Users/><h3>Lista është ende bosh</h3><p>Regjistrimet do të shfaqen këtu në kohë reale.</p></div>}
    </div>
  </section>;
}
function ActionPanel({row,type,onClose,onDone}:{row:Row;type:string;onClose:()=>void;onDone:(m:string)=>void}) { const [busy,setBusy]=useState(false); const run=async (task:PromiseLike<{error:any}>,message:string)=>{setBusy(true);const {error}=await task;if(error){alert(error.message);setBusy(false);return;}onDone(message)}; const client=createClient(); return <aside className="admin-drawer"><button aria-label="Mbyll" onClick={onClose}><X/></button><span>VEPRIME</span><h2>{row.full_name||row.title||row.name||row.id}</h2><p>{type === "users" ? row.email : "Zgjidh veprimin e duhur për këtë rekord."}</p>{type === "users" && <><button disabled={busy} className="primary" onClick={()=>void run(client.from("profiles").update({seller_verified:!row.seller_verified}).eq("id",row.id),row.seller_verified?"Statusi i shitësit u çaktivizua.":"Shitësi u verifikua.")}>{row.seller_verified?"Hiq verifikimin e shitësit":"Verifiko si shitës"}</button><button disabled={busy} onClick={()=>void run(client.from("profiles").update({identity_verified:!row.identity_verified}).eq("id",row.id),"Verifikimi i identitetit u përditësua.")}>Ndrysho verifikimin e identitetit</button></>}{type === "catalog" && <button disabled={busy} className="primary" onClick={()=>void run((row.kind === "Markë" ? client.from("brands") : client.from("categories")).update({is_active:!row.is_active}).eq("id",row.id),row.is_active?"Elementi u çaktivizua.":"Elementi u aktivizua.")}>{row.is_active?"Çaktivizo":"Aktivizo"}</button>}{type === "messages" && !row.read_at && <button disabled={busy} className="primary" onClick={()=>void run(client.from("messages").update({read_at:new Date().toISOString()}).eq("id",row.id),"Mesazhi u shënua si i lexuar.")}>Shëno të lexuar</button>}{type === "orders" && <button onClick={()=>navigator.clipboard.writeText(String(row.id)).then(()=>onDone("ID e porosisë u kopjua."))}>Kopjo ID e porosisë</button>}<button onClick={onClose}>Mbyll</button></aside>; }

function renderCell(key:string, value:any, row:Row) {
  if (key === "price" || key === "total") return <strong>{money(Number(value))}</strong>;
  if (key.endsWith("_at")) return date(value);
  if (["status","seller_verified","is_active","read_at"].includes(key)) return <span className={`status ${value === true || value === "active" || value === "delivered" ? "ok" : "pending"}`}>{typeof value === "boolean" ? (value ? "Po" : "Jo") : value ? label(value) : "Jo"}</span>;
  if (key === "id") return <code>#{String(value).slice(0,8).toUpperCase()}</code>;
  if (key === "full_name") return <span className="person"><i>{(value || row.username || "U")[0]}</i><span><strong>{value || row.username || "Pa emër"}</strong><small>@{row.username || "—"}</small></span></span>;
  return <span className={key === "body" ? "message-cell" : ""}>{value ?? "—"}</span>;
}

function ActivityFeed({data}:{data:Snapshot}) { const events = [...(data.users||[]).slice(0,2).map(x=>({icon:Users,text:`${x.full_name||x.email} u regjistrua`,at:x.created_at})),...(data.listings||[]).slice(0,2).map(x=>({icon:ShoppingBag,text:`Listim i ri: ${x.title}`,at:x.created_at})),...(data.orders||[]).slice(0,2).map(x=>({icon:PackageCheck,text:`Porosi ${String(x.id).slice(0,8)}`,at:x.created_at}))].sort((a,b)=>String(b.at).localeCompare(String(a.at))); return events.length ? <div className="feed">{events.map((e,i)=><div key={i}><i><e.icon size={16}/></i><span><strong>{e.text}</strong><small>{date(e.at)}</small></span></div>)}</div> : <div className="empty compact"><BadgeCheck/><p>Aktiviteti i ri do të shfaqet këtu.</p></div>; }
