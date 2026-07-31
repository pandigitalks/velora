"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "../../lib/supabase/client";
import {
  Activity, BadgeCheck, Bell, Boxes, ChevronDown, CircleDollarSign,
  Command, FileCheck2, Gauge, LayoutDashboard, ListFilter, Menu, MessageSquare,
  MoreHorizontal, PackageCheck, Search, Settings, ShieldCheck, ShoppingBag,
  Sparkles, TrendingUp, Users, X,
} from "lucide-react";
import "./admin.css";

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
  ["catalog", "Katalogu", Boxes],
] as const;

const money = (value: number) => new Intl.NumberFormat("sq-AL", { style: "currency", currency: "EUR" }).format(value || 0);
const date = (value?: string) => value ? new Intl.DateTimeFormat("sq-AL", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value)) : "—";
const label = (value?: string) => (value || "—").replaceAll("_", " ");

export default function AdminDashboard({ initialData, initialModerationQueue, initialSellerApplications, admin }: { initialData: Snapshot; initialModerationQueue: Row[]; initialSellerApplications: Row[]; admin: Row }) {
  const [active, setActive] = useState("overview");
  const [query, setQuery] = useState("");
  const [sidebar, setSidebar] = useState(false);
  const [moderationQueue, setModerationQueue] = useState(initialModerationQueue);
  const [sellerApplications, setSellerApplications] = useState(initialSellerApplications);
  const [moderating, setModerating] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const data = initialData;
  const m = data.metrics || {};
  const title = sections.find(([id]) => id === active)?.[1] || "Pasqyra";

  const rows = useMemo(() => {
    const source = active === "catalog" ? [...(data.categories || []), ...(data.brands || [])] : active === "seller-applications" ? sellerApplications : ((data as any)[active] || []);
    if (!query.trim()) return source;
    const q = query.toLowerCase();
    return source.filter((row: Row) => JSON.stringify(row).toLowerCase().includes(q));
  }, [active, data, query, sellerApplications]);

  return <div className="admin-shell">
    <aside className={`admin-sidebar ${sidebar ? "is-open" : ""}`}>
      <div className="admin-brand"><span>V</span><div>CLOZER<small>COMMAND CENTER</small></div><button onClick={() => setSidebar(false)}><X size={19}/></button></div>
      <nav>
        <p>OPERACIONET</p>
        {sections.map(([id, text, Icon]) => <button key={id} className={active === id ? "active" : ""} onClick={() => { setActive(id); setSidebar(false); }}><Icon size={18}/><span>{text}</span>{id === "listings" && moderationQueue.length > 0 ? <b>{moderationQueue.length}</b> : id === "seller-applications" && sellerApplications.length > 0 ? <b>{sellerApplications.length}</b> : id === "authenticity" && m.pending_authenticity > 0 ? <b>{m.pending_authenticity}</b> : null}</button>)}
        <p>SISTEMI</p>
        <button><Activity size={18}/><span>Aktiviteti</span></button>
        <button><Settings size={18}/><span>Konfigurimi</span></button>
      </nav>
      <div className="admin-user"><div className="avatar">{(admin.full_name || admin.username || "A")[0]}</div><div><strong>{admin.full_name || admin.username || "Administrator"}</strong><small>Super Admin</small></div><ChevronDown size={16}/></div>
    </aside>
    {sidebar && <button aria-label="Mbyll menynë" className="sidebar-scrim" onClick={() => setSidebar(false)}/>} 
    <main className="admin-main">
      <header className="admin-topbar">
        <button className="mobile-menu" onClick={() => setSidebar(true)}><Menu/></button>
        <div className="admin-search"><Search size={18}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Kërko në tërë platformën..."/><kbd>⌘ K</kbd></div>
        <div className="top-actions"><button><Bell size={19}/><i/></button><Link href="/">Shiko faqen</Link></div>
      </header>
      <div className="admin-content">
        <div className="page-heading"><div><p><Command size={14}/> ADMIN / {active.toUpperCase()}</p><h1>{title}</h1><span>Kontroll i plotë dhe të dhëna në kohë reale për Clozer.</span></div><div className="live"><i/> LIVE <small>Përditësuar {new Date(data.generated_at).toLocaleTimeString("sq-AL", {hour:"2-digit",minute:"2-digit"})}</small></div></div>
        {notice && <div className="moderation-notice">{notice}</div>}
        {active === "overview" ? <Overview data={data} /> : active === "seller-applications" ? <SellerApplications rows={rows} busy={moderating} onReview={async (application, decision) => {
          const note = decision === "rejected" ? window.prompt("Shkruaj arsyen e refuzimit:")?.trim() || "" : "";
          if (decision === "rejected" && !note) return;
          setModerating(application.user_id);
          setNotice("");
          const { error } = await createClient().rpc("review_seller_application", { target_user_id: application.user_id, decision, review_note: note || null });
          setModerating(null);
          if (error) { setNotice(`Gabim: ${error.message}`); return; }
          setSellerApplications(current => current.filter(item => item.user_id !== application.user_id));
          setNotice(decision === "approved" ? "Shitësi u aprovua dhe paneli u aktivizua." : "Aplikimi u refuzua.");
        }} /> : <DataSection type={active} rows={rows} query={query} moderationQueue={moderationQueue} moderating={moderating} onModerate={async (listing, status) => {
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
        }} />}
      </div>
    </main>
  </div>;
}

function SellerApplications({ rows, busy, onReview }: { rows: Row[]; busy: string | null; onReview: (application: Row, decision: "approved" | "rejected") => Promise<void> }) {
  return <section className="panel moderation-panel"><div className="moderation-heading"><div><span>APLIKIMET E SHITËSVE</span><h2>{rows.length} aplikime në pritje</h2><p>Kontrollo të dhënat para aktivizimit të panelit të shitësit.</p></div><Users/></div>{rows.length ? <div className="seller-application-admin">{rows.map(row => <article key={row.user_id}><div><span className="status">{row.seller_type === "business" ? "Biznes" : "Individual"}</span><h3>{row.display_name}</h3><p>{row.phone} · {row.city}</p>{row.note && <small>{row.note}</small>}<em>{date(row.created_at)}</em></div><div className="moderation-actions"><button className="approve" disabled={busy === row.user_id} onClick={() => void onReview(row,"approved")}><BadgeCheck/> Aprovo</button><button className="reject" disabled={busy === row.user_id} onClick={() => void onReview(row,"rejected")}><X/> Refuzo</button></div></article>)}</div> : <div className="empty compact"><BadgeCheck/><h3>Nuk ka aplikime në pritje</h3><p>Aplikimet e reja do të shfaqen këtu.</p></div>}</section>;
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

function DataSection({ type, rows, moderationQueue = [], moderating, onModerate }: { type: string; rows: Row[]; query: string; moderationQueue?: Row[]; moderating?: string | null; onModerate?: (listing: Row, status: "active" | "changes_requested" | "rejected") => Promise<void> }) {
  const descriptions: Record<string,string> = { users:"Llogaritë, verifikimet dhe aktiviteti", listings:"Moderimi dhe inventari i marketplace-it", orders:"Pagesat, dërgesat dhe mosmarrëveshjet", messages:"Komunikimi dhe siguria e komunitetit", authenticity:"Radha e kontrolleve të autenticitetit", catalog:"Kategoritë dhe markat e platformës" };
  return <>{type === "listings" && <ModerationQueue rows={moderationQueue} busy={moderating} onModerate={onModerate!}/>}<section className="panel data-panel"><div className="data-toolbar"><div><h2>{rows.length} rezultate</h2><p>{descriptions[type]}</p></div><div><button><ListFilter size={16}/> Filtro</button><button className="primary">Eksporto CSV</button></div></div><MiniTable rows={rows} type={type}/></section></>;
}

function ModerationQueue({ rows, busy, onModerate }: { rows: Row[]; busy?: string | null; onModerate: (listing: Row, status: "active" | "changes_requested" | "rejected") => Promise<void> }) {
  return <section className="panel moderation-panel"><div className="moderation-heading"><div><span>RADHA E MODERIMIT</span><h2>{rows.length} produkte në pritje</h2><p>Kontrollo fotografitë dhe të dhënat para publikimit.</p></div><ShieldCheck/></div>{rows.length ? <div className="moderation-grid">{rows.map(row => { const seller = Array.isArray(row.seller) ? row.seller[0] : row.seller; const image = [...(row.listing_images || [])].sort((a,b) => a.sort_order-b.sort_order)[0]; const publicUrl = image?.storage_path && process.env.NEXT_PUBLIC_SUPABASE_URL ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/listing-images/${image.storage_path.split("/").map(encodeURIComponent).join("/")}` : ""; return <article key={row.id}><div className="moderation-image">{publicUrl ? <img src={publicUrl} alt={row.title}/> : <ShoppingBag/>}</div><div className="moderation-copy"><span className="status">{label(row.status)}</span><h3>{row.title}</h3><p>{seller?.full_name || seller?.username || "Shitës CLOZER"} · {row.category?.name_sq || "Pa kategori"}</p><strong>{money(Number(row.price))}</strong>{row.moderation_note && <small>{row.moderation_note}</small>}</div><div className="moderation-actions"><button disabled={busy === row.id} className="approve" onClick={() => void onModerate(row,"active")}><BadgeCheck/> Aprovo</button><button disabled={busy === row.id} onClick={() => void onModerate(row,"changes_requested")}>Kërko ndryshime</button><button disabled={busy === row.id} className="reject" onClick={() => void onModerate(row,"rejected")}>Refuzo</button></div></article>})}</div> : <div className="empty compact"><BadgeCheck/><h3>Radha është e pastër</h3><p>Nuk ka produkte që presin aprovim.</p></div>}</section>;
}

function MiniTable({ rows, type }: { rows: Row[]; type: string }) {
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
  return <div className="table-wrap"><table><thead><tr>{cols.map(([,h])=><th key={h}>{h}</th>)}<th/></tr></thead><tbody>{rows.slice(0,50).map((row,i)=><tr key={row.id || `${type}-${i}`}>{cols.map(([key])=><td key={key}>{renderCell(key,row[key],row)}</td>)}<td><button className="row-more"><MoreHorizontal size={18}/></button></td></tr>)}</tbody></table></div>;
}

function renderCell(key:string, value:any, row:Row) {
  if (key === "price" || key === "total") return <strong>{money(Number(value))}</strong>;
  if (key.endsWith("_at")) return date(value);
  if (["status","seller_verified","is_active","read_at"].includes(key)) return <span className={`status ${value === true || value === "active" || value === "delivered" ? "ok" : "pending"}`}>{typeof value === "boolean" ? (value ? "Po" : "Jo") : value ? label(value) : "Jo"}</span>;
  if (key === "id") return <code>#{String(value).slice(0,8).toUpperCase()}</code>;
  if (key === "full_name") return <span className="person"><i>{(value || row.username || "U")[0]}</i><span><strong>{value || row.username || "Pa emër"}</strong><small>@{row.username || "—"}</small></span></span>;
  return <span className={key === "body" ? "message-cell" : ""}>{value ?? "—"}</span>;
}

function ActivityFeed({data}:{data:Snapshot}) { const events = [...(data.users||[]).slice(0,2).map(x=>({icon:Users,text:`${x.full_name||x.email} u regjistrua`,at:x.created_at})),...(data.listings||[]).slice(0,2).map(x=>({icon:ShoppingBag,text:`Listim i ri: ${x.title}`,at:x.created_at})),...(data.orders||[]).slice(0,2).map(x=>({icon:PackageCheck,text:`Porosi ${String(x.id).slice(0,8)}`,at:x.created_at}))].sort((a,b)=>String(b.at).localeCompare(String(a.at))); return events.length ? <div className="feed">{events.map((e,i)=><div key={i}><i><e.icon size={16}/></i><span><strong>{e.text}</strong><small>{date(e.at)}</small></span></div>)}</div> : <div className="empty compact"><BadgeCheck/><p>Aktiviteti i ri do të shfaqet këtu.</p></div>; }
