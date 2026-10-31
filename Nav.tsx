"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Logo } from "./Logo";
import { MarketClock } from "./MarketClock";

const DESKTOP = [
  { href: "/", label: "Home" },
  { href: "/trending", label: "Trending" },
  { href: "/screener", label: "Screener" },
  { href: "/watchlist", label: "Watchlist" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/news", label: "Berita" },
  { href: "/compare", label: "Bandingkan" },
  { href: "/calendar", label: "Kalender" },
];

const MOBILE = [
  { href: "/", label: "Home", icon: "M3 11l9-8 9 8v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z" },
  { href: "/trending", label: "Trending", icon: "M3 17l6-6 4 4 8-8M15 7h6v6" },
  { href: "/screener", label: "Screener", icon: "M3 5h18l-7 8v6l-4-2v-4z" },
  { href: "/watchlist", label: "Watchlist", icon: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" },
  { href: "/profile", label: "Profile", icon: "M12 12a4 4 0 100-8 4 4 0 000 8zm-8 9a8 8 0 0116 0" },
];

export default function Nav() {
  const path = usePathname();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [admin, setAdmin] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<{ symbol: string; name: string }[]>([]);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
    const sb = supabaseBrowser();
    sb.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
      // Hanya untuk menampilkan tautan menu. Akses admin sebenarnya diverifikasi di server.
      if (data.user) sb.rpc("is_admin").then(({ data: a }) => setAdmin(!!a));
    });
  }, [path]);

  useEffect(() => {
    if (q.trim().length < 1) { setResults([]); return; }
    const t = setTimeout(async () => {
      const r = await fetch(`/api/stocks/search?q=${encodeURIComponent(q)}`).then((x) => x.json()).catch(() => null);
      setResults(r?.results ?? []);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  async function logout() {
    await supabaseBrowser().auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-ink-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
          <Link href="/" aria-label="TRENDING SAHAM PRO"><Logo /></Link>
          <nav className="ml-4 hidden items-center gap-1 lg:flex">
            {DESKTOP.map((n) => (
              <Link key={n.href} href={n.href} className={`rounded-lg px-3 py-1.5 text-sm transition ${path === n.href ? "bg-electric/15 text-white" : "text-slate-400 hover:text-white"}`}>
                {n.label}
              </Link>
            ))}
            {admin && <Link href="/admin" className="rounded-lg px-3 py-1.5 text-sm text-neon">Admin</Link>}
          </nav>

          <div className="relative ml-auto w-full max-w-xs">
            <input className="input" placeholder="Cari kode / nama saham…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Cari saham" />
            {results.length > 0 && (
              <ul className="glass absolute left-0 right-0 top-11 max-h-72 overflow-auto p-1 shadow-glow">
                {results.map((r) => (
                  <li key={r.symbol}>
                    <Link href={`/stock/${r.symbol}`} onClick={() => { setQ(""); setResults([]); }} className="flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-white/5">
                      <b className="font-mono">{r.symbol}</b><span className="ml-3 truncate text-xs text-slate-400">{r.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            {email ? (
              <>
                <Link href="/profile" className="btn-ghost">Akun</Link>
                <button onClick={logout} className="btn-ghost">Keluar</button>
              </>
            ) : (
              <>
                <Link href="/login" className="btn-ghost">Masuk</Link>
                <Link href="/register" className="btn-primary">Daftar</Link>
              </>
            )}
          </div>
        </div>
        <div className="border-t border-white/5 bg-ink-900/60"><MarketClock /></div>
      </header>

      {/* Navigasi bawah (HP) */}
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-ink-950/95 backdrop-blur-xl lg:hidden" aria-label="Navigasi utama">
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {MOBILE.map((n) => {
            const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
            return (
              <li key={n.href}>
                <Link href={n.href} className={`flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium ${active ? "text-neon" : "text-slate-400"}`}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={n.icon} /></svg>
                  {n.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
