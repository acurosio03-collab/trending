"use client";
import { useCallback, useEffect, useState } from "react";
import { PageTitle, Stat, Unavailable } from "@/components/ui";
import { timeId } from "@/lib/format";

const TABS = ["Statistik", "Pengguna", "Berita", "API Provider", "Saham", "Log Admin", "Pengaturan"] as const;
type Tab = (typeof TABS)[number];

async function api(path: string, init?: RequestInit) {
  const r = await fetch("/api/admin/" + path, init);
  const j = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, j };
}
const post = (resource: string, body: any) => api(resource, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

export default function Admin() {
  const [tab, setTab] = useState<Tab>("Statistik");
  const [denied, setDenied] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = { Statistik: "stats", Pengguna: "users", Berita: "news", "API Provider": "providers", Saham: "symbols", "Log Admin": "logs", Pengaturan: "settings" }[tab];
    const r = await api(res);
    if (r.status === 401 || r.status === 403) { setDenied(r.j.error || "Akses ditolak"); return; }
    setData(r.j);
  }, [tab]);
  useEffect(() => { setData(null); load(); }, [load]);

  const act = async (resource: string, body: any, ok = "Tersimpan.") => {
    const r = await post(resource, body);
    setMsg(r.ok ? ok : r.j.error || "Gagal");
    if (r.ok) load();
  };

  if (denied) return <div><PageTitle title="Admin Panel" /><Unavailable message={denied} /></div>;

  return (
    <div className="space-y-5">
      <PageTitle title="Admin Panel" sub="Setiap aksi diverifikasi role admin dari database dan dicatat di log." />
      <div className="flex gap-1 overflow-x-auto pb-1">
        {TABS.map((t) => <button key={t} onClick={() => { setTab(t); setMsg(null); }} className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-sm font-semibold ${tab === t ? "bg-electric text-white" : "border border-white/10 text-slate-300 hover:bg-white/5"}`}>{t}</button>)}
      </div>
      {msg && <div className="card py-2 text-sm text-electric">{msg}</div>}
      {!data ? <div className="h-40 animate-pulse rounded-2xl bg-white/5" /> : (
        <>
          {tab === "Statistik" && (
            <>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                <Stat label="Pengguna" value={data.users} /><Stat label="Premium" value={data.premium} tone="text-neon" /><Stat label="Berita" value={data.news} /><Stat label="Analisis AI" value={data.analyses} /><Stat label="Error tercatat" value={data.errors} tone="text-loss" />
              </div>
              <div className="card">
                <h2 className="mb-2 font-bold text-white">Status koneksi API (konfigurasi server)</h2>
                {data.providers.map((p: any) => (
                  <div key={p.code} className="flex items-center justify-between border-b border-white/5 py-2 text-sm"><span>{p.name}</span>
                    <span className={`badge ${p.configured ? "bg-neon/15 text-neon" : "bg-loss/15 text-loss"}`}>{p.configured ? "API key terpasang" : "API key belum diisi"}</span></div>
                ))}
                <div className="mt-3 flex flex-wrap gap-2">
                  {[["quotes", "Refresh harga"], ["deep", "Refresh histori+indikator (5 saham)"], ["news", "Ambil berita RSS"]].map(([m, l]) => (
                    <button key={m} className="btn-ghost" onClick={async () => { setMsg("Memproses…"); const r = await fetch(`/api/cron/refresh?mode=${m}`); const j = await r.json(); setMsg(r.ok ? `${l}: ${JSON.stringify(j.result).slice(0, 220)}` : j.error); }}>{l}</button>
                  ))}
                </div>
              </div>
            </>
          )}

          {tab === "Pengguna" && (
            <div className="card overflow-x-auto p-0"><table className="w-full min-w-[820px]">
              <thead><tr className="border-b border-white/10"><th className="th">Email</th><th className="th">Role</th><th className="th">Langganan</th><th className="th">Daftar</th><th className="th">Aksi</th></tr></thead>
              <tbody>{data.users.map((u: any) => (
                <tr key={u.id} className="border-b border-white/5 text-sm">
                  <td className="td">{u.email}<div className="text-[11px] text-slate-500">{u.full_name}</div></td>
                  <td className="td">{u.roles.join(", ") || "user"}{u.is_suspended && <span className="badge ml-2 bg-loss/15 text-loss">suspend</span>}</td>
                  <td className="td text-xs">{u.subscription ? `${u.subscription.plan} • ${u.subscription.status}${u.subscription.expires_at ? " • s/d " + new Date(u.subscription.expires_at).toLocaleDateString("id-ID") : ""}` : "—"}</td>
                  <td className="td text-xs text-slate-500">{timeId(u.created_at)}</td>
                  <td className="td"><div className="flex flex-wrap gap-1">
                    <button className="btn-ghost px-2 py-1 text-xs" onClick={() => act("users", { type: "subscription", userId: u.id, plan: "premium_monthly", status: "active", days: 30 }, "Premium 30 hari diaktifkan.")}>+Premium 30h</button>
                    <button className="btn-ghost px-2 py-1 text-xs" onClick={() => act("users", { type: "subscription", userId: u.id, plan: "free", status: "inactive", days: 0 }, "Premium dinonaktifkan.")}>Cabut premium</button>
                    <button className="btn-ghost px-2 py-1 text-xs" onClick={() => confirm("Jadikan admin?") && act("users", { type: "user_role", userId: u.id, role: "admin", grant: true })}>Admin</button>
                    <button className="btn-ghost px-2 py-1 text-xs text-loss" onClick={() => act("users", { type: "user_status", userId: u.id, suspended: !u.is_suspended })}>{u.is_suspended ? "Aktifkan" : "Suspend"}</button>
                  </div></td></tr>
              ))}</tbody></table></div>
          )}

          {tab === "Berita" && <NewsAdmin items={data.news} act={act} />}

          {tab === "API Provider" && (
            <div className="card">
              <p className="mb-3 text-xs text-slate-400">API key TIDAK disimpan di database/admin; isi lewat Environment Variables server (Vercel). Di sini hanya mengatur aktif/prioritas.</p>
              {data.providers.map((p: any) => {
                const rt = data.runtime.find((r: any) => r.code === p.code);
                return (
                  <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 py-3 text-sm">
                    <div><b>{p.name}</b> <span className="text-xs text-slate-500">({p.code}) • key: {rt?.configured ? "terpasang" : "belum"} • cek terakhir: {timeId(p.last_checked_at)} • {p.last_status || "—"}</span>{p.last_error && <div className="text-xs text-loss">{p.last_error}</div>}</div>
                    <div className="flex items-center gap-2"><label className="text-xs">Prioritas</label>
                      <input className="input w-20" type="number" defaultValue={p.priority} id={`pr-${p.code}`} />
                      <button className="btn-ghost" onClick={() => act("providers", { type: "provider", code: p.code, is_enabled: !p.is_enabled, priority: Number((document.getElementById(`pr-${p.code}`) as HTMLInputElement).value) })}>{p.is_enabled ? "Nonaktifkan" : "Aktifkan"}</button></div>
                  </div>
                );
              })}
              <p className="mt-3 text-xs text-slate-500">Urutan provider yang benar-benar dipakai server ditentukan env <code>STOCK_PROVIDERS</code>.</p>
            </div>
          )}

          {tab === "Saham" && <SymbolsAdmin items={data.symbols} act={act} />}

          {tab === "Log Admin" && (
            <div className="card overflow-x-auto p-0"><table className="w-full min-w-[560px]"><thead><tr className="border-b border-white/10"><th className="th">Waktu</th><th className="th">Aksi</th><th className="th">Target</th></tr></thead>
              <tbody>{data.logs.map((l: any) => <tr key={l.id} className="border-b border-white/5 text-sm"><td className="td text-xs text-slate-500">{timeId(l.created_at)}</td><td className="td font-mono text-xs">{l.action}</td><td className="td text-xs text-slate-400">{l.target_type} {l.target_id}</td></tr>)}</tbody></table></div>
          )}

          {tab === "Pengaturan" && <SettingsAdmin items={data.settings} act={act} />}
        </>
      )}
    </div>
  );
}

function NewsAdmin({ items, act }: any) {
  const [f, setF] = useState({ category: "bei", title: "", summary: "", source_name: "", url: "" });
  return (
    <div className="space-y-4">
      <div className="card grid gap-3 md:grid-cols-2">
        <div><label className="label">Kategori</label><select className="input" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>{["bei", "ekonomi", "perbankan", "energi", "teknologi", "keuangan", "kebijakan", "corporate_action"].map((c) => <option key={c}>{c}</option>)}</select></div>
        <div><label className="label">Sumber</label><input className="input" value={f.source_name} onChange={(e) => setF({ ...f, source_name: e.target.value })} /></div>
        <div className="md:col-span-2"><label className="label">Judul</label><input className="input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
        <div className="md:col-span-2"><label className="label">Ringkasan</label><input className="input" value={f.summary} onChange={(e) => setF({ ...f, summary: e.target.value })} /></div>
        <div className="md:col-span-2"><label className="label">Tautan artikel asli (wajib)</label><input className="input" placeholder="https://…" value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} /></div>
        <button className="btn-primary md:col-span-2" onClick={() => act("news", { type: "news", ...f, summary: f.summary || undefined, published_at: new Date().toISOString() })}>Tambah berita</button>
      </div>
      <div className="card overflow-x-auto p-0"><table className="w-full min-w-[640px]"><tbody>{items.map((n: any) => (
        <tr key={n.id} className="border-b border-white/5 text-sm"><td className="td"><div className="font-semibold">{n.title}</div><div className="text-[11px] text-slate-500">{n.category} • {n.source_name} • {timeId(n.published_at)}</div></td>
          <td className="td text-right"><button className="btn-ghost px-2 py-1 text-xs" onClick={() => act("news", { type: "news_toggle", id: n.id, is_published: !n.is_published })}>{n.is_published ? "Sembunyikan" : "Terbitkan"}</button>{" "}
            <button className="btn-ghost px-2 py-1 text-xs text-loss" onClick={async () => { if (confirm("Hapus?")) { await api("news?id=" + n.id, { method: "DELETE" }); location.reload(); } }}>Hapus</button></td></tr>
      ))}</tbody></table></div>
    </div>
  );
}

function SymbolsAdmin({ items, act }: any) {
  const [f, setF] = useState({ symbol: "", name: "", sector: "" });
  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap gap-2">
        <input className="input w-28" placeholder="Kode" value={f.symbol} onChange={(e) => setF({ ...f, symbol: e.target.value.toUpperCase() })} />
        <input className="input flex-1" placeholder="Nama perusahaan" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <input className="input w-48" placeholder="Sektor" value={f.sector} onChange={(e) => setF({ ...f, sector: e.target.value })} />
        <button className="btn-primary" onClick={() => act("symbols", { type: "symbol", ...f, sector: f.sector || undefined })}>Tambah / ubah</button>
      </div>
      <div className="card overflow-x-auto p-0"><table className="w-full min-w-[520px]"><tbody>{items.map((s: any) => (
        <tr key={s.id} className="border-b border-white/5 text-sm"><td className="td font-mono font-bold">{s.symbol}</td><td className="td">{s.name}</td><td className="td text-slate-400">{s.sector}</td>
          <td className="td text-right"><button className="btn-ghost px-2 py-1 text-xs" onClick={() => act("symbols", { type: "symbol_toggle", id: s.id, is_active: !s.is_active })}>{s.is_active ? "Nonaktifkan" : "Aktifkan"}</button></td></tr>
      ))}</tbody></table></div>
    </div>
  );
}

function SettingsAdmin({ items, act }: any) {
  const [k, setK] = useState("");
  const [v, setV] = useState("");
  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap gap-2">
        <input className="input w-48" placeholder="Kunci (mis. site_name)" value={k} onChange={(e) => setK(e.target.value)} />
        <input className="input flex-1" placeholder='Nilai JSON, mis. "TRENDING SAHAM PRO"' value={v} onChange={(e) => setV(e.target.value)} />
        <button className="btn-primary" onClick={() => { try { act("settings", { type: "setting", key: k, value: JSON.parse(v) }); } catch { alert("Nilai harus JSON valid"); } }}>Simpan</button>
      </div>
      <div className="card text-sm">{items.length === 0 ? "Belum ada pengaturan." : items.map((s: any) => <div key={s.key} className="border-b border-white/5 py-1.5"><b className="font-mono">{s.key}</b>: <span className="text-slate-400">{JSON.stringify(s.value)}</span></div>)}</div>
    </div>
  );
}
