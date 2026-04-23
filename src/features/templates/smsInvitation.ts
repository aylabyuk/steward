/** Build the native `sms:` URL for the Messages composer. iOS and
 *  Android historically disagreed on the query separator (`&` vs
 *  `?`), but the `sms:<number>?body=...` form with a standard `?`
 *  works on both iOS 15+ (2021) and recent Android. The `sms:<number>&body=...`
 *  variant still works on iOS too. Use `?` as the portable default
 *  and keep the iOS-specific fallback here in case a future iOS
 *  version drops one of them.
 *
 *  `phone` is sanitized to digits + optional leading `+` so spaces
 *  or dashes in the bishop's input don't break the URL.
 */
export interface SmsInvitationInput {
  phone: string;
  body: string;
}

export function buildSmsHref({ phone, body }: SmsInvitationInput): string {
  const normalized = normalizePhone(phone);
  return `sms:${normalized}?body=${encodeURIComponent(body)}`;
}

export function openSmsInvitation(input: SmsInvitationInput): void {
  window.location.href = buildSmsHref(input);
}

/** Strip whitespace, dashes, parens — keep digits + a single leading `+`. */
export function normalizePhone(raw: string): string {
  const trimmed = raw.trim();
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  return hasPlus ? `+${digits}` : digits;
}

/** Minimal feasibility check: has enough digits to plausibly be a
 *  phone number. Intentionally lax — the bishop enters whatever
 *  format their phone book uses, and the Messages app is the real
 *  arbiter when the href opens. */
export function isPlausiblePhone(raw: string): boolean {
  const digits = raw.replace(/\D/g, "");
  return digits.length >= 7;
}

/** Coerce common North American phone entries into strict E.164
 *  (`+14165551234`). Twilio's Conversations API rejects anything
 *  else with "Invalid messaging binding address", so we normalize
 *  on blur before the value lands in Firestore.
 *
 *  Rules (NANP-biased because the app is ward-scoped and Canadian):
 *  - already `+...` → strip non-digits inside, keep the +
 *  - 10 digits → assume NANP, prepend `+1`
 *  - 11 digits starting with 1 → prepend `+`
 *  - anything else → return digits-only; the caller flags it as
 *    non-E.164 and the UI shows a hint. */
export function toE164(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  if (hasPlus) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return digits;
}

/** Strict E.164: `+` then 7–15 digits, no leading zero. Matches
 *  the ITU spec. Used for client-side validation — Twilio applies
 *  its own check server-side. */
export function isE164(value: string): boolean {
  return /^\+[1-9]\d{6,14}$/.test(value);
}

/** Default SMS body. Short enough to fit one standard SMS segment
 *  (160 chars) when the `{{inviteUrl}}` is a typical Firestore token
 *  URL (~65 chars). Variables are interpolated by the caller. */
export const DEFAULT_SPEAKER_SMS_BODY =
  "Hi {{speakerName}}, you've been invited to speak in sacrament meeting on {{date}}. Full invitation: {{inviteUrl}}";

export interface SpeakerSmsVars {
  speakerName: string;
  date: string; // short form — "Apr 26" keeps the message under one segment
  inviteUrl: string;
}

export function renderSmsBody(vars: SpeakerSmsVars): string {
  return DEFAULT_SPEAKER_SMS_BODY.replace("{{speakerName}}", vars.speakerName)
    .replace("{{date}}", vars.date)
    .replace("{{inviteUrl}}", vars.inviteUrl);
}
