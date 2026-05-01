import { defineSecret, defineString } from "firebase-functions/params";

/** Twilio REST + Conversations API credentials. */
export const TWILIO_ACCOUNT_SID = defineSecret("TWILIO_ACCOUNT_SID");
export const TWILIO_AUTH_TOKEN = defineSecret("TWILIO_AUTH_TOKEN");

/** Dedicated API Key + Secret used to sign chat access tokens
 *  (JWTs). Separate from the Account token so rotating them doesn't
 *  invalidate server-side REST calls. */
export const TWILIO_API_KEY_SID = defineSecret("TWILIO_API_KEY_SID");
export const TWILIO_API_KEY_SECRET = defineSecret("TWILIO_API_KEY_SECRET");

/** Conversations Service SID — groups all ward conversations into a
 *  single service and scopes JWT grants. */
export const TWILIO_CONVERSATIONS_SERVICE_SID = defineSecret("TWILIO_CONVERSATIONS_SERVICE_SID");

/** Canadian long-code number the service uses for outbound SMS. */
export const TWILIO_FROM_NUMBER = defineSecret("TWILIO_FROM_NUMBER");

/** Optional secondary outbound number, used only when a developer-mode
 *  caller (gated by email allowlist in sendSpeakerInvitation) opts an
 *  invitation into "testing" mode. Lets the maintainer keep the prior
 *  prod number addressable for production-side smoke tests without
 *  affecting normal sends. Unset in lower envs — sendSmsDirect treats
 *  the missing value as a hard error to avoid silently routing to the
 *  wrong number. */
export const TWILIO_FROM_NUMBER_TESTING = defineSecret("TWILIO_FROM_NUMBER_TESTING");

/** Optional Messaging Service SID. When set, production-mode SMS
 *  sends route through the service (Twilio picks the actual sender
 *  from the pool attached to the service) instead of the raw
 *  TWILIO_FROM_NUMBER. The service-level "Disable Inbound and
 *  Outbound Message Body Logging" toggle then applies — Twilio
 *  redacts message bodies in its retained logs after delivery,
 *  bounding the lifetime of any logged invitation URL.
 *
 *  Add the same TWILIO_FROM_NUMBER as a sender on the service so
 *  Twilio has a number to send from. Testing-mode sends still use
 *  TWILIO_FROM_NUMBER_TESTING directly — the testing number isn't
 *  in the service's pool and doesn't need the same retention
 *  treatment. */
export const TWILIO_MESSAGING_SERVICE_SID = defineSecret("TWILIO_MESSAGING_SERVICE_SID");

/** Pinned webhook URL Twilio is configured to call. When set, the
 *  signature-verification path uses this exact value as the signing
 *  URL instead of constructing one from request headers. Eliminates
 *  host-header drift as a silent-failure mode (e.g. a region change
 *  or custom-domain swap leaving signatures perpetually invalid).
 *  Set this to the public URL Twilio Console points at — typically
 *  https://us-central1-<project>.cloudfunctions.net/onTwilioWebhook
 *  or a custom-domain equivalent. Unset = fall back to constructing
 *  the URL from `req.host` + `req.originalUrl` (prior behaviour).
 *  Webhook-only — bound by onTwilioWebhook's `WEBHOOK_SECRETS`,
 *  intentionally not in the global `TWILIO_SECRETS` bundle. */
export const TWILIO_WEBHOOK_URL = defineSecret("TWILIO_WEBHOOK_URL");

/** Public origin of the web app (e.g. https://steward-app.ca) —
 *  used by Cloud Functions to build invite URLs in outbound
 *  correspondence. Runtime-configurable, not a secret. */
export const STEWARD_ORIGIN = defineString("STEWARD_ORIGIN", {
  default: "https://steward-app.ca",
});

/** All Twilio-touching secrets bundled for convenient spread onto a
 *  function's `secrets` array. */
export const TWILIO_SECRETS = [
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_API_KEY_SID,
  TWILIO_API_KEY_SECRET,
  TWILIO_CONVERSATIONS_SERVICE_SID,
  TWILIO_FROM_NUMBER,
  TWILIO_FROM_NUMBER_TESTING,
  TWILIO_MESSAGING_SERVICE_SID,
];

// SendGrid (SENDGRID_API_KEY / INVITATION_FROM_EMAIL) is intentionally
// NOT declared via defineSecret — doing so would force Firebase to
// prompt for them at every deploy even when no function binds them.
// The sendgrid/client.ts module reads process.env at runtime and
// throws if unset; callers already try/catch that. Re-enable by
// adding `defineSecret` calls here + threading the binding through
// the two consuming functions.
