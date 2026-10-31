"use client";
import { ColorType, createChart, type IChartApi } from "lightweight-charts";
import { useEffect, useRef } from "react";

interface Candle { time: string; open: number; high: number; low: number; close: number; volume: number | null }
interface Line { time: string; value: number }

// Grafik candlestick + volume + overlay garis (MA/Bollinger). Semua data dari API (bukan acak).
export function PriceChart({
  candles, overlays = [], mode = "candles", height = 380,
}: {
  candles: Candle[];
  overlays?: { name: string; color: string; data: Line[]; dashed?: boolean }[];
  mode?: "candles" | "line";
  height?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || candles.length === 0) return;
    const chart: IChartApi = createChart(ref.current, {
      height,
      layout: { background: { type: ColorType.Solid, color: "transparent" }, textColor: "#94a3b8", fontFamily: "Inter, sans-serif" },
      grid: { vertLines: { color: "rgba(255,255,255,0.04)" }, horzLines: { color: "rgba(255,255,255,0.04)" } },
      rightPriceScale: { borderColor: "rgba(255,255,255,0.1)" },
      timeScale: { borderColor: "rgba(255,255,255,0.1)", timeVisible: false },
      crosshair: { mode: 1 },
      autoSize: true,
    });

    if (mode === "candles") {
      const s = chart.addCandlestickSeries({
        upColor: "#18ff8a", downColor: "#ff4d6a", borderUpColor: "#18ff8a", borderDownColor: "#ff4d6a", wickUpColor: "#18ff8a", wickDownColor: "#ff4d6a",
      });
      s.setData(candles.map((c) => ({ time: c.time, open: c.open, high: c.high, low: c.low, close: c.close })));
    } else {
      const up = candles[candles.length - 1].close >= candles[0].close;
      const s = chart.addAreaSeries({
        lineColor: up ? "#18ff8a" : "#ff4d6a",
        topColor: up ? "rgba(24,255,138,0.28)" : "rgba(255,77,106,0.28)",
        bottomColor: "rgba(0,0,0,0)", lineWidth: 2,
      });
      s.setData(candles.map((c) => ({ time: c.time, value: c.close })));
    }

    const hasVol = candles.some((c) => c.volume);
    if (hasVol) {
      const v = chart.addHistogramSeries({ priceFormat: { type: "volume" }, priceScaleId: "vol" });
      chart.priceScale("vol").applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
      v.setData(candles.map((c) => ({ time: c.time, value: c.volume || 0, color: c.close >= c.open ? "rgba(24,255,138,0.3)" : "rgba(255,77,106,0.3)" })));
    }

    overlays.forEach((o) => {
      if (!o.data.length) return;
      const l = chart.addLineSeries({ color: o.color, lineWidth: 1, lineStyle: o.dashed ? 2 : 0, priceLineVisible: false, lastValueVisible: false, title: o.name });
      l.setData(o.data);
    });

    chart.timeScale().fitContent();
    return () => chart.remove();
  }, [candles, overlays, mode, height]);

  if (candles.length === 0) return <div className="flex h-40 items-center justify-center text-sm text-slate-500">Tidak ada data grafik.</div>;
  return <div ref={ref} style={{ height }} className="w-full" />;
}
