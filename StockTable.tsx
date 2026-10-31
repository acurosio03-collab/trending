"use client";
import Link from "next/link";
import { colorFor, compact, idr, pct, timeId } from "@/lib/format";
import { StatusBadge } from "./ui";

export interface Row {
  symbol: string; name: string; price: number; change: number; changePercent: number;
  volume: number | null; value: number | null; status?: string | null; fetchedAt?: string | null; volumeRatio?: number | null;
}

export function StockTable({ rows, showRatio = false }: { rows: Row[]; showRatio?: boolean }) {
  if (rows.length === 0) return <div className="p-6 text-center text-sm text-slate-500">Tidak ada data untuk ditampilkan.</div>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px]">
        <thead>
          <tr className="border-b border-white/10">
            <th className="th">Kode</th><th className="th">Perusahaan</th>
            <th className="th text-right">Harga</th><th className="th text-right">Perubahan</th><th className="th text-right">%</th>
            <th className="th text-right">Volume</th><th className="th text-right">Nilai</th>
            {showRatio && <th className="th text-right">Vol ×</th>}
            <th className="th">Update</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.symbol} className="border-b border-white/5 transition hover:bg-white/[0.03]">
              <td className="td"><Link href={`/stock/${r.symbol}`} className="font-mono font-bold text-electric hover:underline">{r.symbol}</Link></td>
              <td className="td max-w-[220px] truncate text-slate-300">{r.name}</td>
              <td className="td text-right font-mono">{idr(r.price)}</td>
              <td className={`td text-right font-mono ${colorFor(r.change)}`}>{r.change > 0 ? "+" : ""}{idr(r.change)}</td>
              <td className={`td text-right font-mono font-bold ${colorFor(r.changePercent)}`}>{pct(r.changePercent)}</td>
              <td className="td text-right font-mono text-slate-300">{compact(r.volume)}</td>
              <td className="td text-right font-mono text-slate-300">{compact(r.value)}</td>
              {showRatio && <td className="td text-right font-mono text-slate-300">{r.volumeRatio ? r.volumeRatio.toFixed(2) + "×" : "—"}</td>}
              <td className="td"><div className="flex flex-col gap-0.5"><StatusBadge status={r.status} /><span className="text-[10px] text-slate-500">{timeId(r.fetchedAt)}</span></div></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
