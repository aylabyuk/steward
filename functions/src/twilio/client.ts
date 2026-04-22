import twilio, { type Twilio } from "twilio";

/** Lazily-initialized Twilio REST client. Reads credentials from
 *  process.env at first use (populated by the secrets binding on each
 *  Cloud Function that needs it). Cached at module scope so repeated
 *  warm invocations reuse one instance. */
let cached: Twilio | null = null;
export function getTwilioClient(): Twilio {
  if (cached) return cached;
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) {
    throw new Error("Twilio credentials missing (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN).");
  }
  cached = twilio(sid, token);
  return cached;
}

/** Reset for tests — pair with vi.mock('twilio', ...) to swap the
 *  underlying client. */
export function resetTwilioClientForTests(): void {
  cached = null;
}
