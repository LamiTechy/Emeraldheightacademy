/**
 * In-memory sliding-window rate limiter + login lockout.
 *
 * Single-instance by design (fine for one Vercel region). For horizontal
 * scaling, swap the Map below for a Neon-backed or Redis store — the call
 * sites stay identical.
 */

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

const MAX_BUCKETS = 10_000;

function prune(now: number) {
  if (buckets.size <= MAX_BUCKETS) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export type RateLimitResult = {
  ok: boolean;
  retryAfterSeconds: number;
  remaining: number;
};

export function rateLimit(options: {
  /** unique key, e.g. `login:1.2.3.4:user@example.com` */
  key: string;
  limit: number;
  windowMs: number;
}): RateLimitResult {
  const now = Date.now();
  prune(now);

  const bucket = buckets.get(options.key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(options.key, { count: 1, resetAt: now + options.windowMs });
    return { ok: true, retryAfterSeconds: 0, remaining: options.limit - 1 };
  }

  if (bucket.count >= options.limit) {
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
      remaining: 0,
    };
  }

  bucket.count += 1;
  return {
    ok: true,
    retryAfterSeconds: 0,
    remaining: options.limit - bucket.count,
  };
}

/** Clears a key after a successful action (e.g. correct login). */
export function rateLimitReset(key: string): void {
  buckets.delete(key);
}

export const RATE_LIMITS = {
  login: { limit: 5, windowMs: 15 * 60 * 1000 },
  forgotPassword: { limit: 3, windowMs: 60 * 60 * 1000 },
  resetPassword: { limit: 5, windowMs: 60 * 60 * 1000 },
  changePassword: { limit: 5, windowMs: 15 * 60 * 1000 },
  publicForm: { limit: 5, windowMs: 10 * 60 * 1000 },
} as const;

/** Extracts a stable client IP from request headers. */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
