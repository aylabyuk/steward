import { logger } from "firebase-functions/v2";
import twilio from "twilio";

export interface VerifyTwilioSignatureInput {
  /** `X-Twilio-Signature` header value, or undefined when the header
   *  isn't present. */
  signature: string | undefined;
  /** `TWILIO_AUTH_TOKEN` value, or undefined when the secret isn't
   *  injected. */
  authToken: string | undefined;
  /** Signing URL Twilio used when computing the signature. Should be
   *  the URL Twilio Console is configured with — `https://...` plus
   *  any path/query — verbatim. */
  url: string;
  /** Form-urlencoded body parameters, deserialized. */
  params: Record<string, string>;
}

/** Pure verification helper. Wraps `twilio.validateRequest` with
 *  defence-in-depth checks (missing header / missing token short-circuit
 *  to false) and structured logging on failure so a Cloud Logging
 *  metric can alarm on rate.
 *
 *  Log key `twilio.webhook.signature_failed` with a `reason` label —
 *  `missing-header`, `missing-auth-token`, or `invalid` — distinguishes
 *  a misconfigured webhook from an actively-tampered request. */
export function verifyTwilioSignature(input: VerifyTwilioSignatureInput): boolean {
  if (!input.signature) {
    logger.warn("twilio.webhook.signature_failed", { reason: "missing-header" });
    return false;
  }
  if (!input.authToken) {
    logger.warn("twilio.webhook.signature_failed", { reason: "missing-auth-token" });
    return false;
  }
  const ok = twilio.validateRequest(input.authToken, input.signature, input.url, input.params);
  if (!ok) {
    logger.warn("twilio.webhook.signature_failed", { reason: "invalid" });
  }
  return ok;
}
