import { logger } from "firebase-functions/v2";

/** In-memory per-IP token-bucket rate limiter. Fluid Compute reuses
 *  function instances across concurrent requests, so this map persists
 *  across invocations on the same instance. Spread across instances
 *  the limit is per-instance (effectively higher), but combined with
 *  App Check enforcement that's an acceptable tradeoff: App Check is
 *  the primary defense; this is a best-effort backstop against abuse
 *  bursts that slip through. */
const buckets = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitInput {
  bucketKey: string;
  /** Max attempts allowed in the rolling window. */
  max: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

/** Returns true when the call is within the limit, false when it
 *  should be rejected. Bumps the counter on each allowed call. */
export function rateLimitOk(input: RateLimitInput): boolean {
  const now = Date.now();
  evictExpired(now);
  const entry = buckets.get(input.bucketKey);
  if (!entry || entry.resetAt <= now) {
    buckets.set(input.bucketKey, { count: 1, resetAt: now + input.windowMs });
    return true;
  }
  if (entry.count >= input.max) return false;
  entry.count += 1;
  return true;
}

/** Trim entries past their reset time so the map can't grow unbounded
 *  on a long-lived warm instance. Cheap because we only walk when at
 *  least N entries have accumulated. */
function evictExpired(now: number): void {
  if (buckets.size < 256) return;
  for (const [key, entry] of buckets) {
    if (entry.resetAt <= now) buckets.delete(key);
  }
}

/** Pull the caller IP from a Cloud Functions v2 callable request.
 *  Cloud Run sets `x-forwarded-for` with the real client IP as the
 *  first hop. Falls back to `req.ip` (Express's resolution) and
 *  finally to a literal so the bucket key is never empty. */
export function callerIp(rawRequest: {
  ip?: string | undefined;
  headers?: Record<string, string | string[] | undefined> | undefined;
}): string {
  const xff = rawRequest.headers?.["x-forwarded-for"];
  if (typeof xff === "string" && xff.length > 0) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  if (Array.isArray(xff) && xff.length > 0 && xff[0]) {
    const first = xff[0].split(",")[0]?.trim();
    if (first) return first;
  }
  return rawRequest.ip || "unknown";
}

/** Emit the same alarm-able label PR-14 added to the rotation rate
 *  limit so a single Cloud Logging metric can cover both surfaces. */
export function logRateLimited(scope: string, ip: string, extra?: Record<string, unknown>): void {
  logger.warn("invitation.rate_limited", {
    event: "invitation.rate_limited",
    scope,
    ip,
    ...extra,
  });
}
