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
];

// SendGrid (SENDGRID_API_KEY / INVITATION_FROM_EMAIL) is intentionally
// NOT declared via defineSecret — doing so would force Firebase to
// prompt for them at every deploy even when no function binds them.
// The sendgrid/client.ts module reads process.env at runtime and
// throws if unset; callers already try/catch that. Re-enable by
// adding `defineSecret` calls here + threading the binding through
// the two consuming functions.
