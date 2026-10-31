import { envInt } from "./cache";

// Rate limiter jendela tetap, per kunci (IP atau user id). In-memory per instance.
// Produksi skala besar: gunakan Upstash Ratelimit / Vercel KV.
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit = envInt("RATE_LIMIT_PER_MINUTE", 60), windowMs = 60_000) {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfter: 0 };
  }
  b.count += 1;
  if (b.count > limit) {
    return { allowed: false, remaining: 0, retryAfter: Math.ceil((b.resetAt - now) / 1000) };
  }
  return { allowed: true, remaining: limit - b.count, retryAfter: 0 };
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || "unknown";
}
