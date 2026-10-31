"use client";
import { useEffect, useState } from "react";

// Jam pasar global. Status buka/tutup dihitung dari jadwal reguler (tanpa memperhitungkan libur bursa).
const MARKETS = [
  { name: "BEI", tz: "Asia/Jakarta", open: [9, 0], close: [15, 49], lunch: [[12, 0], [13, 30]] as const },
  { name: "Tokyo", tz: "Asia/Tokyo", open: [9, 0], close: [15, 30] },
  { name: "Hong Kong", tz: "Asia/Hong_Kong", open: [9, 30], close: [16, 0] },
  { name: "London", tz: "Europe/London", open: [8, 0], close: [16, 30] },
  { name: "New York", tz: "America/New_York", open: [9, 30], close: [16, 0] },
];

function parts(tz: string, d: Date) {
  const f = new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", second: "2-digit", weekday: "short", hour12: false }).formatToParts(d);
  const get = (t: string) => f.find((p) => p.type === t)?.value || "";
  return { h: Number(get("hour")) % 24, m: Number(get("minute")), s: get("second"), wd: get("weekday") };
}

export function MarketClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!now) return <div className="h-8" />;

  return (
    <div className="mx-auto flex max-w-7xl gap-5 overflow-x-auto px-4 py-1.5 text-[11px] whitespace-nowrap">
      {MARKETS.map((m) => {
        const p = parts(m.tz, now);
        const mins = p.h * 60 + p.m;
        const weekend = p.wd === "Sat" || p.wd === "Sun";
        let open = !weekend && mins >= m.open[0] * 60 + m.open[1] && mins < m.close[0] * 60 + m.close[1];
        if (open && m.lunch && mins >= m.lunch[0][0] * 60 + m.lunch[0][1] && mins < m.lunch[1][0] * 60 + m.lunch[1][1]) open = false;
        return (
          <span key={m.name} className="flex items-center gap-1.5 text-slate-400">
            <span className={`h-1.5 w-1.5 rounded-full ${open ? "bg-neon shadow-neon" : "bg-slate-600"}`} />
            <b className="text-slate-200">{m.name}</b>
            <span className="font-mono">{String(p.h).padStart(2, "0")}:{String(p.m).padStart(2, "0")}:{p.s}</span>
            <span className={open ? "text-neon" : "text-slate-500"}>{open ? "BUKA" : "TUTUP"}</span>
          </span>
        );
      })}
    </div>
  );
}
