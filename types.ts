export type DataStatus = "realtime" | "delayed" | "historical";

export interface Quote {
  symbol: string;
  name?: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number | null;
  value: number | null;
  status: DataStatus;
  provider: string;
  /** waktu data menurut provider (ISO) */
  sourceTime: string | null;
  /** waktu server mengambil data (ISO) */
  fetchedAt: string;
}

export interface Candle {
  time: string; // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number | null;
}

export interface Fundamentals {
  marketCap: number | null;
  per: number | null;
  pbv: number | null;
  eps: number | null;
  dividendYield: number | null;
  week52High: number | null;
  week52Low: number | null;
  provider: string;
}

export type ProviderResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; rateLimited?: boolean };

/** Kontrak adapter: provider baru cukup mengimplementasikan interface ini. */
export interface StockProvider {
  code: string;
  name: string;
  supportsRealtime: boolean;
  isConfigured(): boolean;
  getQuote(symbol: string): Promise<ProviderResult<Quote>>;
  getHistory(symbol: string, days: number): Promise<ProviderResult<Candle[]>>;
  getFundamentals?(symbol: string): Promise<ProviderResult<Fundamentals>>;
}

export type Role = "user" | "premium" | "admin";
