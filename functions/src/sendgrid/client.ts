import sgMail from "@sendgrid/mail";
import { logger } from "firebase-functions/v2";

/** In local dev the Firebase emulator sets `FUNCTIONS_EMULATOR=true`.
 *  We use that as the single signal to stub SendGrid delivery — real
 *  sends would need a live API key that dev machines shouldn't carry
 *  anyway. */
function isStubbed(): boolean {
  return process.env.FUNCTIONS_EMULATOR === "true";
}

let configured = false;
/** Returns true when SendGrid is ready to send; false when the key is
 *  missing. Missing-config is NOT a throw — callers degrade gracefully
 *  (log + skip) so that email failures don't cascade into killing
 *  unrelated side effects (FCM pushes, SMS, status writes) that
 *  happen alongside in the same Cloud Function invocation. */
function ensureConfigured(): boolean {
  if (configured) return true;
  const key = process.env.SENDGRID_API_KEY;
  if (!key) return false;
  sgMail.setApiKey(key);
  configured = true;
  return true;
}

export interface EmailInput {
  to: string;
  /** Display name prefixed onto the verified From address, e.g.
   *  `"Bishop Haymond (via Steward) <bishopric@mail.steward-app.ca>"`. */
  fromDisplayName: string;
  replyTo?: string;
  /** Optional CC recipients. Used for the speaker's response-receipt
   *  email so the bishopric sees a copy in the same thread. */
  cc?: readonly string[];
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail(input: EmailInput): Promise<string | null> {
  if (isStubbed()) {
    logger.info("[sendgrid:stub] email captured (not sent)", {
      to: input.to,
      cc: input.cc,
      replyTo: input.replyTo,
      fromDisplayName: input.fromDisplayName,
      subject: input.subject,
      textPreview: input.text.slice(0, 400),
    });
    return `stub-${Date.now()}`;
  }
  if (!ensureConfigured()) {
    logger.warn("sendEmail skipped — SENDGRID_API_KEY not configured", {
      to: input.to,
      subject: input.subject,
    });
    return null;
  }
  const fromAddress = process.env.INVITATION_FROM_EMAIL;
  if (!fromAddress) {
    logger.warn("sendEmail skipped — INVITATION_FROM_EMAIL not configured", {
      to: input.to,
      subject: input.subject,
    });
    return null;
  }
  const [res] = await sgMail.send({
    to: input.to,
    from: { email: fromAddress, name: input.fromDisplayName },
    subject: input.subject,
    text: input.text,
    ...(input.replyTo ? { replyTo: input.replyTo } : {}),
    ...(input.cc && input.cc.length > 0 ? { cc: [...input.cc] } : {}),
    ...(input.html ? { html: input.html } : {}),
  });
  return res.headers["x-message-id"] ?? null;
}

/** Reset for tests. */
export function resetSendgridForTests(): void {
  configured = false;
}
