import Link from "next/link";
import { timeId } from "@/lib/format";

export function StatusBadge({ status }: { status?: string | null }) {
  const map: Record<string, string> = {
    realtime: "bg-neon/15 text-neon",
    delayed: "bg-amber-400/15 text-amber-300",
    historical: "bg-electric/15 text-electric",
  };
  const label: Record<string, string> = { realtime: "Real-time", delayed: "Delayed", historical: "Historis" };
  if (!status) return null;
  return <span className={`badge ${map[status] || "bg-slate-600/30 text-slate-300"}`}>{label[status] || status}</span>;
}

export function Unavailable({ message }: { message?: string }) {
  return (
    <div className="card border-amber-400/20 text-sm text-amber-200">
      <b>Data sedang tidak tersedia.</b>{" "}
      <span className="text-amber-200/80">{message || "Periksa konfigurasi API provider atau coba lagi nanti."}</span>
    </div>
  );
}

export function UpdatedAt({ iso, provider, status }: { iso?: string | null; provider?: string | null; status?: string | null }) {
  return (
    <span className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
      <StatusBadge status={status} />
      <span>Update: {timeId(iso)}</span>
      {provider && <span>• Sumber: {provider}</span>}
    </span>
  );
}

export function PremiumGate({ title = "Fitur Premium" }: { title?: string }) {
  return (
    <div className="card text-center">
      <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-electric/15 text-electric">★</div>
      <h3 className="font-bold text-white">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-slate-400">Fitur ini tersedia untuk pengguna Premium. Status premium diverifikasi dari server.</p>
      <Link href="/upgrade" className="btn-primary mt-4">Lihat paket Premium</Link>
    </div>
  );
}

export function Stat({ label, value, sub, tone }: { label: string; value: React.ReactNode; sub?: React.ReactNode; tone?: string }) {
  return (
    <div className="card">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</div>
      <div className={`mt-1 font-mono text-xl font-bold md:text-2xl ${tone || "text-white"}`}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

export function PageTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-5">
      <h1 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">{title}</h1>
      {sub && <p className="mt-1 text-sm text-slate-400">{sub}</p>}
    </div>
  );
}
