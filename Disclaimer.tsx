import Link from "next/link";

export const DISCLAIMER_TEXT =
  "Informasi yang ditampilkan hanya untuk edukasi dan informasi, bukan rekomendasi investasi atau jaminan keuntungan.";

export function Disclaimer({ compact = false }: { compact?: boolean }) {
  return (
    <p className={`rounded-xl border border-amber-400/20 bg-amber-400/5 text-amber-200/90 ${compact ? "px-3 py-2 text-[11px]" : "px-4 py-3 text-xs"}`}>
      ⚠ {DISCLAIMER_TEXT} Investasi saham mengandung risiko, termasuk kehilangan sebagian atau seluruh modal.{" "}
      <Link href="/privacy" className="underline">Kebijakan</Link>
    </p>
  );
}
