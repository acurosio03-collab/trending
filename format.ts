export const idr = (n: number | null | undefined) =>
  n === null || n === undefined || !Number.isFinite(n) ? "—" : n.toLocaleString("id-ID", { maximumFractionDigits: 2 });

export const pct = (n: number | null | undefined) =>
  n === null || n === undefined || !Number.isFinite(n) ? "—" : `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;

export function compact(n: number | null | undefined) {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  const a = Math.abs(n);
  if (a >= 1e12) return (n / 1e12).toFixed(2) + " T";
  if (a >= 1e9) return (n / 1e9).toFixed(2) + " M";
  if (a >= 1e6) return (n / 1e6).toFixed(2) + " Jt";
  if (a >= 1e3) return (n / 1e3).toFixed(1) + " Rb";
  return String(Math.round(n));
}

export const colorFor = (n: number | null | undefined) =>
  n === null || n === undefined ? "text-slate-400" : n > 0 ? "text-neon" : n < 0 ? "text-loss" : "text-slate-300";

export const timeId = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "medium", timeStyle: "short" }) + " WIB" : "—";
