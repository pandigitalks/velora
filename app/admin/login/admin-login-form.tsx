"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, ShieldCheck } from "lucide-react";
import { createClient } from "../../../lib/supabase/client";

export default function AdminLoginForm({ forbidden }: { forbidden: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(forbidden ? "Kjo llogari nuk ka qasje në panelin administrativ." : "");

  const login = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    const client = createClient();
    const { data, error: signInError } = await client.auth.signInWithPassword({ email: email.trim(), password });
    if (signInError || !data.user) {
      setBusy(false);
      setError("Emaili ose fjalëkalimi i administratorit nuk është i saktë.");
      return;
    }
    const { data: profile } = await client.from("profiles").select("is_admin").eq("id", data.user.id).single();
    if (!profile?.is_admin) {
      await client.auth.signOut();
      setBusy(false);
      setError("Kjo llogari nuk ka qasje në panelin administrativ.");
      return;
    }
    window.location.assign("/admin");
  };

  return <main className="admin-login-page">
    <section className="admin-login-brand">
      <Link href="/" className="admin-login-logo">CLOZER<sup>®</sup></Link>
      <div className="admin-login-copy"><span>PRIVATE ACCESS</span><h1>Command<br/>Center.</h1><p>Kontrolli i platformës, komunitetit dhe lansimit — në një vend të sigurt.</p></div>
      <div className="admin-login-security"><ShieldCheck/><span><b>Qasje e mbrojtur</b><small>Vetëm për administratorët e autorizuar</small></span></div>
    </section>
    <section className="admin-login-panel">
      <Link href="/" className="admin-login-back"><ArrowLeft/> Kthehu në faqe</Link>
      <form onSubmit={login}>
        <div className="admin-login-lock"><LockKeyhole/></div>
        <span>ADMINISTRIMI</span>
        <h2>Mirë se u ktheve.</h2>
        <p>Kyçu me kredencialet e administratorit.</p>
        <label><span>Email</span><input type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="admin@clozer.shop" required autoComplete="username"/></label>
        <label><span>Fjalëkalimi</span><div><input type={showPassword ? "text" : "password"} value={password} onChange={event => setPassword(event.target.value)} placeholder="••••••••••••" required autoComplete="current-password"/><button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? "Fshih fjalëkalimin" : "Shfaq fjalëkalimin"}>{showPassword ? <EyeOff/> : <Eye/>}</button></div></label>
        {error && <div className="admin-login-error">{error}</div>}
        <button className="admin-login-submit" disabled={busy}>{busy ? "Duke verifikuar…" : "Hyr në panel"}<ArrowRight/></button>
        <small>Sesioni verifikohet me Supabase Auth dhe rolin Super Admin.</small>
      </form>
    </section>
  </main>;
}
