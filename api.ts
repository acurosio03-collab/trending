import { NextResponse } from "next/server";
import { clientIp, rateLimit } from "./rate-limit";

/** Mengembalikan Response 429 jika melewati batas, atau null jika boleh lanjut. */
export function limited(req: Request, scope = "api", limit?: number) {
  const r = rateLimit(`${scope}:${clientIp(req)}`, limit);
  if (r.allowed) return null;
  return NextResponse.json(
    { error: "Terlalu banyak permintaan. Coba lagi sebentar lagi." },
    { status: 429, headers: { "Retry-After": String(r.retryAfter) } },
  );
}

export const SYMBOL_RE = /^[A-Z0-9]{3,6}$/;
export const cleanSymbol = (s: string | null | undefined) => (s || "").toUpperCase().trim();

export const noData = (error: string, status = 503) => NextResponse.json({ error, unavailable: true }, { status });

export const RANGE_DAYS: Record<string, number> = {
  "1D": 5, "1W": 7, "1M": 31, "3M": 93, "6M": 186, "1Y": 366, ALL: 5000,
};
