/**
 * A tiny in-memory sliding-window rate limiter. Pure and dependency-free so it
 * can be unit-tested. On serverless this limits per-instance (not globally
 * shared), which is still a meaningful guard against runaway cost/abuse on the
 * public chat endpoint that bills a real Anthropic key.
 */

const hits = new Map<string, number[]>();

export interface RateResult {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now(),
): RateResult {
  const cutoff = now - windowMs;
  const recent = (hits.get(key) ?? []).filter((t) => t > cutoff);

  if (recent.length >= limit) {
    const retryAfterSec = Math.max(1, Math.ceil((recent[0] + windowMs - now) / 1000));
    hits.set(key, recent);
    return { ok: false, remaining: 0, retryAfterSec };
  }

  recent.push(now);
  hits.set(key, recent);

  // Opportunistically keep the map from growing unbounded.
  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      if (v.every((t) => t <= cutoff)) hits.delete(k);
    }
  }

  return { ok: true, remaining: limit - recent.length, retryAfterSec: 0 };
}

/** Best-effort client key from proxy headers, falling back to a shared bucket. */
export function clientKey(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "shared";
}
