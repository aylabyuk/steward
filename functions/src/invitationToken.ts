import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/** Generate a fresh capability token (base64url-encoded 32 random
 *  bytes — ~256 bits of entropy). Plaintext leaves the server exactly
 *  once, in the invitation URL delivered by SMS/email. */
export function generateInvitationToken(): string {
  return randomBytes(32).toString("base64url");
}

/** SHA-256 (hex) of the token. The doc stores only this hash; the
 *  plaintext token is never persisted. */
export function hashInvitationToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Constant-time compare of a hex-encoded SHA-256 hash against a
 *  freshly-hashed presented token. Both must be valid hex of equal
 *  length or this returns false without leaking the reason. */
export function tokenHashMatches(presentedToken: string, storedHex: string): boolean {
  const presentedHex = hashInvitationToken(presentedToken);
  if (presentedHex.length !== storedHex.length) return false;
  const a = Buffer.from(presentedHex, "hex");
  const b = Buffer.from(storedHex, "hex");
  if (a.length !== b.length || a.length === 0) return false;
  return timingSafeEqual(a, b);
}

/** Daily bucket key for rate-limit accounting. UTC so the bucket
 *  boundary is stable regardless of the caller's timezone. */
export function rotationBucketKey(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** Max visitor-triggered rotations per invitation per UTC day. Caps
 *  Twilio SMS cost exposure if a link leaks. Bishop-driven re-sends
 *  (via sendSpeakerInvitation) don't count against this cap. */
export const ROTATION_DAILY_CAP = 3;

/** Extract the last 4 digits of an E.164 phone for the "sent to
 *  phone ending in ••XXXX" rotation message. Returns null when the
 *  input isn't recognizable — callers render a generic fallback. */
export function phoneLast4(e164: string | undefined): string | null {
  if (!e164) return null;
  const digits = e164.replace(/\D/g, "");
  if (digits.length < 4) return null;
  return digits.slice(-4);
}
