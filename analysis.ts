import { computeSnapshot, supportResistance, volatilityPct } from "./indicators";
import type { Candle, Quote } from "./types";

// "AI Stock Analyst" berbasis aturan (rule-based) di atas data aktual.
// Bisa ditingkatkan dengan LLM: kirim objek hasil di bawah sebagai konteks, jangan data karangan.
// Tidak memberi sinyal beli/jual pasti atau janji keuntungan.

export interface Analysis {
  symbol: string;
  sentiment: "Bullish" | "Bearish" | "Netral";
  momentum: string;
  supports: number[];
  resistances: number[];
  volumeNote: string;
  volatilityNote: string;
  summary: string;
  scenarios: { optimistic: string; neutral: string; pessimistic: string };
  risks: string[];
  dataProvider: string;
  dataAsOf: string;
  generatedAt: string;
  disclaimer: string;
}

const fmt = (n: number) => n.toLocaleString("id-ID", { maximumFractionDigits: 2 });

export function analyze(symbol: string, quote: Quote, candles: Candle[]): Analysis {
  const snap = computeSnapshot(candles);
  const { supports, resistances } = supportResistance(candles);
  const vol = volatilityPct(candles);
  const price = quote.price;

  let score = 0;
  const notes: string[] = [];
  if (snap.ma20 !== null) { if (price > snap.ma20) { score++; notes.push("harga di atas MA20"); } else { score--; notes.push("harga di bawah MA20"); } }
  if (snap.ma50 !== null) { if (price > snap.ma50) { score++; notes.push("di atas MA50"); } else { score--; notes.push("di bawah MA50"); } }
  if (snap.ma200 !== null) { if (price > snap.ma200) { score++; notes.push("di atas MA200"); } else { score--; notes.push("di bawah MA200"); } }
  if (snap.macdHist !== null) { if (snap.macdHist > 0) { score++; notes.push("histogram MACD positif"); } else { score--; notes.push("histogram MACD negatif"); } }

  const sentiment: Analysis["sentiment"] = score >= 2 ? "Bullish" : score <= -2 ? "Bearish" : "Netral";

  let momentum = "Data RSI belum cukup.";
  if (snap.rsi14 !== null) {
    const r = snap.rsi14;
    momentum = r >= 70 ? `RSI ${fmt(r)}: area jenuh beli (overbought), potensi koreksi meningkat.`
      : r <= 30 ? `RSI ${fmt(r)}: area jenuh jual (oversold), potensi teknikal rebound meningkat namun belum pasti.`
      : `RSI ${fmt(r)}: momentum berada di zona netral.`;
  }

  const recent = candles.slice(-20).map((c) => c.volume).filter((v): v is number => v !== null);
  let volumeNote = "Data volume historis belum cukup.";
  if (recent.length >= 10 && quote.volume !== null) {
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const ratio = avg > 0 ? quote.volume / avg : 0;
    volumeNote = `Volume terakhir ${fmt(quote.volume)} lembar (${fmt(ratio)}× rata-rata 20 hari)` +
      (ratio >= 1.5 ? " — di atas normal, ada peningkatan aktivitas." : ratio <= 0.6 ? " — di bawah normal, partisipasi rendah." : " — dalam kisaran normal.");
  }

  const volatilityNote = vol === null ? "Data volatilitas belum cukup."
    : `Volatilitas harian ±${fmt(vol)}% (20 hari) — ${vol > 3 ? "tinggi" : vol > 1.5 ? "sedang" : "rendah"}.`;

  const s1 = supports[0], r1 = resistances[0];
  const summary =
    `${symbol} berada di ${fmt(price)} (${quote.changePercent >= 0 ? "+" : ""}${fmt(quote.changePercent)}%). ` +
    `Sentimen teknikal: ${sentiment}${notes.length ? " — " + notes.join(", ") : ""}. ${momentum}`;

  const scenarios = {
    optimistic: r1 ? `Jika harga menembus resistance ${fmt(r1)} dengan volume mendukung, tren naik berpotensi berlanjut.` : "Jika momentum positif bertahan, tren naik berpotensi berlanjut.",
    neutral: s1 && r1 ? `Harga berpotensi bergerak sideways di antara support ${fmt(s1)} dan resistance ${fmt(r1)}.` : "Harga berpotensi bergerak sideways pada kisaran saat ini.",
    pessimistic: s1 ? `Jika harga turun di bawah support ${fmt(s1)}, tekanan jual berpotensi meningkat.` : "Jika momentum melemah, tekanan jual berpotensi meningkat.",
  };

  const risks = [
    "Indikator teknikal bersifat historis dan tidak menjamin pergerakan harga di masa depan.",
    "Data dapat tertunda (delayed) tergantung provider; harga di bursa bisa berbeda.",
    "Berita, kebijakan, dan kondisi global dapat mengubah harga secara tiba-tiba.",
    vol !== null && vol > 3 ? "Volatilitas saham ini tinggi sehingga risiko fluktuasi harga lebih besar." : "Likuiditas dan volatilitas dapat berubah sewaktu-waktu.",
  ];

  return {
    symbol, sentiment, momentum,
    supports, resistances, volumeNote, volatilityNote, summary, scenarios, risks,
    dataProvider: quote.provider,
    dataAsOf: quote.sourceTime ?? quote.fetchedAt,
    generatedAt: new Date().toISOString(),
    disclaimer: "Informasi hanya untuk edukasi dan informasi, bukan rekomendasi investasi atau jaminan keuntungan.",
  };
}
