import type { Candle } from "./types";

// Semua indikator dihitung dari data historis (candle) yang valid — tidak ada angka acak.

export function sma(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = [];
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    out.push(i >= period - 1 ? sum / period : null);
  }
  return out;
}

export function ema(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = [];
  if (values.length < period) return values.map(() => null);
  const k = 2 / (period + 1);
  let prev = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) out.push(null);
    else if (i === period - 1) out.push(prev);
    else {
      prev = values[i] * k + prev * (1 - k);
      out.push(prev);
    }
  }
  return out;
}

/** RSI Wilder */
export function rsi(values: number[], period = 14): (number | null)[] {
  const out: (number | null)[] = values.map(() => null);
  if (values.length <= period) return out;
  let gain = 0, loss = 0;
  for (let i = 1; i <= period; i++) {
    const d = values[i] - values[i - 1];
    if (d >= 0) gain += d; else loss -= d;
  }
  let avgG = gain / period, avgL = loss / period;
  out[period] = avgL === 0 ? 100 : 100 - 100 / (1 + avgG / avgL);
  for (let i = period + 1; i < values.length; i++) {
    const d = values[i] - values[i - 1];
    avgG = (avgG * (period - 1) + Math.max(d, 0)) / period;
    avgL = (avgL * (period - 1) + Math.max(-d, 0)) / period;
    out[i] = avgL === 0 ? 100 : 100 - 100 / (1 + avgG / avgL);
  }
  return out;
}

export function macd(values: number[], fast = 12, slow = 26, signalP = 9) {
  const ef = ema(values, fast);
  const es = ema(values, slow);
  const line: (number | null)[] = values.map((_, i) => (ef[i] !== null && es[i] !== null ? (ef[i] as number) - (es[i] as number) : null));
  const firstIdx = line.findIndex((v) => v !== null);
  const signal: (number | null)[] = values.map(() => null);
  if (firstIdx >= 0) {
    const sub = line.slice(firstIdx) as number[];
    const sig = ema(sub, signalP);
    sig.forEach((v, i) => (signal[firstIdx + i] = v));
  }
  const hist = line.map((v, i) => (v !== null && signal[i] !== null ? v - (signal[i] as number) : null));
  return { line, signal, hist };
}

export function bollinger(values: number[], period = 20, mult = 2) {
  const mid = sma(values, period);
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];
  for (let i = 0; i < values.length; i++) {
    const m = mid[i];
    if (m === null) { upper.push(null); lower.push(null); continue; }
    const slice = values.slice(i - period + 1, i + 1);
    const sd = Math.sqrt(slice.reduce((a, b) => a + (b - m) ** 2, 0) / period);
    upper.push(m + mult * sd);
    lower.push(m - mult * sd);
  }
  return { upper, middle: mid, lower };
}

export interface IndicatorSnapshot {
  rsi14: number | null;
  macd: number | null;
  macdSignal: number | null;
  macdHist: number | null;
  ma20: number | null;
  ma50: number | null;
  ma200: number | null;
  bbUpper: number | null;
  bbMiddle: number | null;
  bbLower: number | null;
  asOf: string | null;
  candleCount: number;
}

const last = <T>(a: (T | null)[]): T | null => (a.length ? a[a.length - 1] : null);

export function computeSnapshot(candles: Candle[]): IndicatorSnapshot {
  const closes = candles.map((c) => c.close);
  const m = macd(closes);
  const bb = bollinger(closes);
  return {
    rsi14: last(rsi(closes)),
    macd: last(m.line),
    macdSignal: last(m.signal),
    macdHist: last(m.hist),
    ma20: last(sma(closes, 20)),
    ma50: last(sma(closes, 50)),
    ma200: last(sma(closes, 200)),
    bbUpper: last(bb.upper),
    bbMiddle: last(bb.middle),
    bbLower: last(bb.lower),
    asOf: candles.length ? candles[candles.length - 1].time : null,
    candleCount: candles.length,
  };
}

/** Series lengkap untuk digambar di grafik (time + value, null dibuang). */
export function toLineSeries(candles: Candle[], values: (number | null)[]) {
  const out: { time: string; value: number }[] = [];
  values.forEach((v, i) => { if (v !== null && Number.isFinite(v)) out.push({ time: candles[i].time, value: v }); });
  return out;
}

/** Pivot sederhana untuk support/resistance dari swing high/low 60 hari terakhir. */
export function supportResistance(candles: Candle[], lookback = 60, window = 3) {
  const slice = candles.slice(-lookback);
  const highs: number[] = [], lows: number[] = [];
  for (let i = window; i < slice.length - window; i++) {
    const seg = slice.slice(i - window, i + window + 1);
    if (slice[i].high === Math.max(...seg.map((c) => c.high))) highs.push(slice[i].high);
    if (slice[i].low === Math.min(...seg.map((c) => c.low))) lows.push(slice[i].low);
  }
  const price = candles[candles.length - 1]?.close ?? 0;
  const supports = [...new Set(lows)].filter((v) => v < price).sort((a, b) => b - a).slice(0, 3);
  const resistances = [...new Set(highs)].filter((v) => v > price).sort((a, b) => a - b).slice(0, 3);
  return { supports, resistances };
}

export function volatilityPct(candles: Candle[], period = 20): number | null {
  const closes = candles.slice(-(period + 1)).map((c) => c.close);
  if (closes.length < period + 1) return null;
  const rets: number[] = [];
  for (let i = 1; i < closes.length; i++) rets.push(Math.log(closes[i] / closes[i - 1]));
  const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
  const sd = Math.sqrt(rets.reduce((a, b) => a + (b - mean) ** 2, 0) / rets.length);
  return sd * 100;
}
