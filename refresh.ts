import { computeSnapshot } from "./indicators";
import { getFundamentals, getHistory, getQuote } from "./providers";
import { supabaseAdmin } from "./supabase/server";

async function pool<T, R>(items: T[], size: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, async () => {
      while (i < items.length) {
        const idx = i++;
        out[idx] = await fn(items[idx]);
      }
    }),
  );
  return out;
}

/** Mode "quotes": ambil harga terakhir semua saham aktif. Mode "deep": histori + indikator + fundamental untuk sebagian saham. */
export async function refreshMarket(mode: "quotes" | "deep", offset = 0, limit = 5) {
  const db = supabaseAdmin();
  const { data: symbols } = await db.from("stock_symbols").select("id,symbol").eq("is_active", true).order("symbol");
  if (!symbols?.length) return { updated: 0, failed: 0, errors: ["Tidak ada saham aktif"] };

  const targets = mode === "deep" ? symbols.slice(offset, offset + limit) : symbols;
  const errors: string[] = [];
  let updated = 0;

  await pool(targets, mode === "deep" ? 2 : 3, async (s) => {
    if (mode === "quotes") {
      const q = await getQuote(s.symbol);
      if (!q.ok) { errors.push(`${s.symbol}: ${q.error}`); return; }
      const { error } = await db.from("stock_prices").upsert(
        {
          symbol_id: s.id, price: q.data.price, change: q.data.change, change_percent: q.data.changePercent,
          volume: q.data.volume, value: q.data.value, status: q.data.status, provider: q.data.provider,
          source_time: q.data.sourceTime, fetched_at: q.data.fetchedAt,
        },
        { onConflict: "symbol_id" },
      );
      if (error) errors.push(`${s.symbol}: ${error.message}`); else updated++;
      return;
    }

    const h = await getHistory(s.symbol, 400);
    if (!h.ok) { errors.push(`${s.symbol}: ${h.error}`); return; }
    await db.from("stock_historical_prices").upsert(
      h.data.map((c) => ({
        symbol_id: s.id, trade_date: c.time, open: c.open, high: c.high, low: c.low, close: c.close, volume: c.volume, provider: "auto",
      })),
      { onConflict: "symbol_id,trade_date" },
    );
    const snap = computeSnapshot(h.data);
    await db.from("stock_indicators").upsert(
      {
        symbol_id: s.id, rsi14: snap.rsi14, macd: snap.macd, macd_signal: snap.macdSignal, macd_hist: snap.macdHist,
        ma20: snap.ma20, ma50: snap.ma50, ma200: snap.ma200, bb_upper: snap.bbUpper, bb_middle: snap.bbMiddle, bb_lower: snap.bbLower,
        calculated_from: snap.asOf, calculated_at: new Date().toISOString(),
      },
      { onConflict: "symbol_id" },
    );
    const f = await getFundamentals(s.symbol);
    if (f.ok) {
      await db.from("stock_fundamentals").upsert(
        {
          symbol_id: s.id, market_cap: f.data.marketCap, per: f.data.per, pbv: f.data.pbv, eps: f.data.eps,
          dividend_yield: f.data.dividendYield, week52_high: f.data.week52High, week52_low: f.data.week52Low,
          provider: f.data.provider, updated_at: new Date().toISOString(),
        },
        { onConflict: "symbol_id" },
      );
    }
    updated++;
  });

  return { updated, failed: errors.length, errors: errors.slice(0, 20), total: targets.length };
}
