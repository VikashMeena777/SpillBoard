/**
 * Fixed-window rate limiter, in process memory.
 *
 * The old build shipped Upstash env vars in .env.example but never installed the
 * package or wrote a limiter, so the documented 3-spills-per-day free cap and
 * the AI endpoint were both completely unprotected.
 *
 * Caveat worth knowing: this is per server instance. It stops casual abuse and
 * accidental double-submits, and it is the correct shape to swap for Upstash
 * Redis when the app runs on more than one instance.
 */

interface Window {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Window>();

/** Drop expired windows so the map cannot grow without bound. */
function sweep(now: number): void {
  if (buckets.size < 5_000) return;
  for (const [key, win] of buckets) {
    if (win.resetAt <= now) buckets.delete(key);
  }
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  limit: number;
  /** Seconds until the window resets. */
  retryAfter: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, limit, retryAfter: 0 };
  }

  existing.count += 1;
  const remaining = Math.max(0, limit - existing.count);

  return {
    ok: existing.count <= limit,
    remaining,
    limit,
    retryAfter: Math.ceil((existing.resetAt - now) / 1000),
  };
}

/**
 * Best-effort client fingerprint. Prefers the anonymous visitor id and falls
 * back to proxy headers.
 */
export function clientKey(req: Request, anonId?: string): string {
  if (anonId) return `anon:${anonId}`;

  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
  return `ip:${ip}`;
}

export const RATE_LIMITS = {
  /** Creating spills: expensive (LLM call) and the abuse target. */
  spill: { limit: 8, windowMs: 60 * 60 * 1000 },
  /** Reactions and votes: cheap but spammable. */
  interact: { limit: 120, windowMs: 60 * 1000 },
  comment: { limit: 20, windowMs: 10 * 60 * 1000 },
} as const;
