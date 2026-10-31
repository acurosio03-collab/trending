"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { LogoMark } from "./Logo";

type Mode = "login" | "register" | "forgot" | "reset";

function Form({ mode }: { mode: Mode }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [msg, setMsg] = useState<{ t: "err" | "ok"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (mode !== "forgot" && password.length < 8 && mode !== "login") { setMsg({ t: "err", text: "Password minimal 8 karakter." }); return; }
    setBusy(true);
    const sb = supabaseBrowser();
    const site = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    try {
      if (mode === "login") {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        const next = sp.get("next");
        router.push(next && next.startsWith("/") && !next.startsWith("//") ? next : "/");
        router.refresh();
      } else if (mode === "register") {
        const { data, error } = await sb.auth.signUp({ email, password, options: { data: { full_name: name }, emailRedirectTo: `${site}/auth/callback` } });
        if (error) throw error;
        if (data.session) { router.push("/"); router.refresh(); }
        else setMsg({ t: "ok", text: "Pendaftaran berhasil. Cek email Anda untuk konfirmasi akun." });
      } else if (mode === "forgot") {
        const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: `${site}/auth/callback?next=/forgot-password?reset=1` });
        if (error) throw error;
        setMsg({ t: "ok", text: "Jika email terdaftar, tautan reset password telah dikirim." });
      } else {
        const { error } = await sb.auth.updateUser({ password });
        if (error) throw error;
        setMsg({ t: "ok", text: "Password berhasil diubah." });
        setTimeout(() => router.push("/"), 1200);
      }
    } catch (err: any) {
      setMsg({ t: "err", text: err?.message || "Terjadi kesalahan." });
    } finally { setBusy(false); }
  }

  const title = { login: "Masuk", register: "Buat Akun", forgot: "Lupa Password", reset: "Password Baru" }[mode];

  return (
    <div className="mx-auto max-w-md pt-6">
      <div className="card shadow-glow">
        <div className="mb-5 flex items-center gap-3"><LogoMark size={40} /><div><h1 className="text-xl font-extrabold text-white">{title}</h1><p className="text-xs text-slate-400">TRENDING SAHAM PRO</p></div></div>
        <form onSubmit={submit} className="space-y-3">
          {mode === "register" && <div><label className="label">Nama</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} required maxLength={60} /></div>}
          {mode !== "reset" && <div><label className="label">Email</label><input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></div>}
          {mode !== "forgot" && <div><label className="label">{mode === "reset" ? "Password baru" : "Password"}</label><input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete={mode === "login" ? "current-password" : "new-password"} /></div>}
          {msg && <p className={`rounded-lg px-3 py-2 text-sm ${msg.t === "err" ? "bg-loss/10 text-loss" : "bg-neon/10 text-neon"}`}>{msg.text}</p>}
          <button className="btn-primary w-full" disabled={busy}>{busy ? "Memproses…" : title}</button>
        </form>
        <div className="mt-4 flex justify-between text-xs text-slate-400">
          {mode === "login" && <><Link href="/forgot-password" className="hover:text-white">Lupa password?</Link><Link href="/register" className="text-electric">Daftar gratis</Link></>}
          {mode === "register" && <><span /><Link href="/login" className="text-electric">Sudah punya akun? Masuk</Link></>}
          {(mode === "forgot" || mode === "reset") && <><span /><Link href="/login" className="text-electric">Kembali ke login</Link></>}
        </div>
      </div>
    </div>
  );
}

export function AuthForm({ mode }: { mode: Mode }) {
  return <Suspense fallback={null}><Form mode={mode} /></Suspense>;
}
