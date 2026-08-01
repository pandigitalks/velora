"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { ArrowRight, Check, Copy, Gift, Mail, Share2, Sparkles, Users } from "lucide-react";
import { createClient } from "../../lib/supabase/client";
import styles from "./waitlist.module.css";

type Stats = { enabled: boolean; total: number; gift_cards: number; gift_value: number };
type Result = { joined: boolean; position: number; referral_code: string; referrals: number; entries: number };

const interestOptions = [
  ["buyer", "Dua të blej"],
  ["seller", "Dua të shes"],
  ["both", "Të dyja"],
] as const;

export default function WaitlistLanding({ initialStats, initialReferral = "" }: { initialStats: Stats; initialReferral?: string }) {
  const [stats, setStats] = useState(initialStats);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [interest, setInterest] = useState("both");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [copied, setCopied] = useState(false);
  const shareUrl = useMemo(() => result ? "https://clozer.shop/waitlist?ref=" + result.referral_code : "", [result]);

  const join = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    const { data, error: requestError } = await createClient().rpc("join_waitlist", {
      p_full_name: name,
      p_email: email,
      p_phone: phone || null,
      p_interest: interest,
      p_referral_code: initialReferral || null,
    });
    setBusy(false);
    if (requestError) {
      setError(requestError.message || "Regjistrimi nuk u përfundua. Provo përsëri.");
      return;
    }
    setResult(data as Result);
    if (data?.joined) setStats(current => ({ ...current, total: Number(current.total || 0) + 1 }));
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  if (!stats.enabled) return (
    <main className={styles.closed}>
      <Link href="/" className={styles.logo}>CLOZER<sup>®</sup></Link>
      <div><span>LISTA E PRITJES</span><h1>Dyert janë mbyllur.<br/><em>Për tani.</em></h1><p>Waitlist-i nuk është aktiv. Marketplace-i CLOZER është vetëm një hap larg.</p><Link href="/" className={styles.darkButton}>Kthehu në CLOZER <ArrowRight /></Link></div>
    </main>
  );

  return <main className={styles.page}>
    <header className={styles.header}>
      <Link href="/" className={styles.logo}>CLOZER<sup>®</sup></Link>
      <div className={styles.liveCount}><i/><span>{Number(stats.total || 0).toLocaleString("sq-AL")} vende të rezervuara</span></div>
      <a href="#rezervo" className={styles.headerCta}>Rezervo vendin</a>
    </header>

    <section className={styles.hero}>
      <div className={styles.heroImage}><Image src="/assets/editorial-luxury.webp" alt="Editorial mode CLOZER" fill priority sizes="(max-width: 800px) 100vw, 48vw" /></div>
      <div className={styles.heroCopy}>
        <div className={styles.giftPill}><Gift/><span>{stats.gift_cards} GIFT CARDS · €{Number(stats.gift_value).toLocaleString("sq-AL")} SECILA</span></div>
        <span className={styles.eyebrow}>QASJE E HERSHME · KOSOVË</span>
        <h1>CLOZER po vjen.<br/><em>Hyr para të gjithëve.</em></h1>
        <p>Rezervo qasjen e hershme në marketplace-in e ri të modës dhe hyr automatikisht në short për një nga {stats.gift_cards} CLOZER Gift Cards.</p>
        <a href="#rezervo" className={styles.heroButton}>Rezervo vendin tim <ArrowRight/></a>
        <div className={styles.socialProof}><div><Users/></div><span><b>{Number(stats.total || 0).toLocaleString("sq-AL")} persona</b><small>janë tashmë në listë</small></span></div>
      </div>
    </section>

    <section className={styles.marquee} aria-label="Përfitimet"><span>QASJE E HERSHME</span><i>✦</i><span>3 × €100 GIFT CARDS</span><i>✦</i><span>OFERTA EKSKLUZIVE</span><i>✦</i><span>BLERJE DHE SHITJE</span></section>

    <section className={styles.benefits}>
      <div className={styles.sectionIntro}><span>PSE CLOZER FIRST?</span><h2>Vendi yt në rreshtin e parë.</h2><p>Anëtarët e parë nuk marrin vetëm një njoftim. Marrin përparësi.</p></div>
      <div className={styles.benefitGrid}>
        <article><b>01</b><Sparkles/><h3>Qasje para lansimit</h3><p>Hyr në CLOZER para hapjes së plotë dhe zbulo produktet i pari.</p></article>
        <article><b>02</b><Gift/><h3>Fito €100</h3><p>Çdo regjistrim merr një hyrje; çdo referim i vlefshëm të jep një hyrje shtesë.</p></article>
        <article><b>03</b><Mail/><h3>Vetëm gjërat me vlerë</h3><p>Lansimi, qasja dhe përfitimet e anëtarëve të parë. Pa spam.</p></article>
      </div>
    </section>

    <section className={styles.joinSection} id="rezervo">
      <div className={styles.joinVisual}>
        <Image src="/assets/blazer-one.webp" alt="CLOZER fashion" fill sizes="(max-width: 800px) 100vw, 42vw" />
        <div><span>THE FIRST EDIT</span><h2>Stili fillon<br/>para turmës.</h2></div>
      </div>
      <div className={styles.formSide}>
        {!result ? <>
          <span className={styles.eyebrow}>REZERVO VENDIN TËND</span>
          <h2>Ji ndër të parët.</h2>
          <p>Plotëso të dhënat dhe pozita jote ruhet menjëherë.</p>
          <form onSubmit={join} className={styles.form}>
            <label><span>Emri i plotë</span><input value={name} onChange={event => setName(event.target.value)} placeholder="Emri dhe mbiemri" required minLength={2} /></label>
            <label><span>Email</span><input value={email} onChange={event => setEmail(event.target.value)} type="email" placeholder="emri@email.com" required /></label>
            <label><span>Telefoni <em>opsional</em></span><input value={phone} onChange={event => setPhone(event.target.value)} type="tel" placeholder="+383 4X XXX XXX" /></label>
            <fieldset><legend>Çfarë dëshiron të bësh?</legend><div>{interestOptions.map(([value, label]) => <button type="button" key={value} className={interest === value ? styles.selected : ""} onClick={() => setInterest(value)}>{label}</button>)}</div></fieldset>
            {initialReferral && <div className={styles.referralNotice}><Check/> Ftesa jote nga një mik u aplikua.</div>}
            {error && <p className={styles.error}>{error}</p>}
            <button className={styles.submit} disabled={busy}>{busy ? "Duke rezervuar…" : "Rezervo vendin tim"}<ArrowRight/></button>
            <small>Duke u regjistruar, pranon të marrësh njoftime për lansimin dhe shortin e CLOZER.</small>
          </form>
        </> : <div className={styles.success}>
          <div className={styles.successIcon}><Check/></div>
          <span>{result.joined ? "VENDI YT U REZERVUA" : "TI JE TASHMË NË LISTË"}</span>
          <h2>Je numri<br/><em>#{result.position}</em></h2>
          <p>Ke <b>{result.entries} hyrje</b> në short. Fto miqtë dhe rrit mundësinë për të fituar.</p>
          <div className={styles.shareBox}><small>LINKU YT PERSONAL</small><div><input readOnly value={shareUrl}/><button onClick={copyLink} aria-label="Kopjo linkun">{copied ? <Check/> : <Copy/>}</button></div></div>
          <button className={styles.shareButton} onClick={() => navigator.share ? navigator.share({ title: "CLOZER po vjen", text: "Hyr para të gjithëve në CLOZER.", url: shareUrl }) : copyLink()}><Share2/> Shpërndaje ftesën</button>
          <small className={styles.referralCount}>{result.referrals} referime · {result.entries} hyrje gjithsej</small>
        </div>}
      </div>
    </section>

    <section className={styles.giveaway}>
      <span>THE CLOZER FIRST DROP</span><h2>Tre vende.<br/><em>Tre fitues.</em></h2>
      <div className={styles.cards}>{Array.from({length: Number(stats.gift_cards || 3)}).map((_, index) => <article key={index}><small>CLOZER GIFT CARD</small><strong>€{Number(stats.gift_value).toLocaleString("sq-AL")}</strong><span>0{index + 1} / 0{stats.gift_cards}</span></article>)}</div>
      <p>Nuk kërkohet blerje. Fituesit përzgjidhen pas lansimit dhe Gift Card përdoret vetëm brenda CLOZER. Kushtet finale komunikohen para shortit.</p>
    </section>

    <section className={styles.faq}>
      <div><span>PYETJET KRYESORE</span><h2>Para se të hysh.</h2></div>
      <div className={styles.faqList}>
        <details><summary>Kur lansohet CLOZER?<i>+</i></summary><p>Anëtarët e waitlist-it do ta marrin datën dhe qasjen e hershme direkt me email.</p></details>
        <details><summary>Si funksionon shorti?<i>+</i></summary><p>Regjistrimi të jep një hyrje. Çdo mik unik që regjistrohet me linkun tënd të jep një hyrje shtesë.</p></details>
        <details><summary>A mund të regjistrohem si shitës?<i>+</i></summary><p>Po. Zgjidh “Dua të shes” ose “Të dyja” dhe do të njoftohesh për qasjen e shitësve.</p></details>
        <details><summary>A paguaj diçka tani?<i>+</i></summary><p>Jo. Waitlist-i dhe pjesëmarrja në short janë falas.</p></details>
      </div>
    </section>

    <footer className={styles.footer}><Link href="/" className={styles.logo}>CLOZER<sup>®</sup></Link><p>Remarkable pieces. Second lives.</p><div><Share2/><span>© 2026 CLOZER</span></div></footer>
  </main>;
}
