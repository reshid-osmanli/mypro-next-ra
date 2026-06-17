type Bucket = { count: number; resetAt: number; blockedUntil?: number };

const globalForRateLimit = globalThis as unknown as { __kutubiRateLimit?: Map<string, Bucket> };
const buckets = globalForRateLimit.__kutubiRateLimit ?? new Map<string, Bucket>();
if (!globalForRateLimit.__kutubiRateLimit) globalForRateLimit.__kutubiRateLimit = buckets;

function cleanup(now: number) {
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now && (!bucket.blockedUntil || bucket.blockedUntil <= now)) {
      buckets.delete(key);
    }
  }
}

export function getRequestIp(req: Request) {
  const normalize = (value: string | null) => {
    const first = value?.split(",")[0]?.trim();
    if (!first) return null;
    const safe = first.replace(/[^\w:.-]/g, "").slice(0, 80);
    return safe || null;
  };

  return normalize(req.headers.get("cf-connecting-ip")) ?? normalize(req.headers.get("x-real-ip")) ?? normalize(req.headers.get("x-forwarded-for")) ?? "unknown";
}

export function isRateLimited(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  cleanup(now);
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    bucket.blockedUntil = Math.max(bucket.blockedUntil ?? 0, bucket.resetAt);
    return true;
  }
  return false;
}

export function rateLimitHeaders(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  cleanup(now);
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) return { remaining: limit, resetAt: now + windowMs, limited: false };
  return { remaining: Math.max(0, limit - bucket.count), resetAt: bucket.resetAt, limited: bucket.count > limit };
}
