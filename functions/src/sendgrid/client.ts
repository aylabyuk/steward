import sgMail from "@sendgrid/mail";
import { logger } from "firebase-functions/v2";

/** In local dev the Firebase emulator sets `FUNCTIONS_EMULATOR=true`.
 *  We use that as the single signal to stub SendGrid delivery — real
 *  sends would need a live API key that dev machines shouldn't carry
 *  anyway. Outside the emulator a missing key still throws, so a
 *  prod mis-config fails loud. */
function isStubbed(): boolean {
  return process.env.FUNCTIONS_EMULATOR === "true";
}

let configured = false;
function ensureConfigured(): void {
  if (configured) return;
  const key = process.env.SENDGRID_API_KEY;
  if (!key) throw new Error("SENDGRID_API_KEY missing.");
  sgMail.setApiKey(key);
  configured = true;
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
  ensureConfigured();
  const fromAddress = process.env.INVITATION_FROM_EMAIL;
  if (!fromAddress) throw new Error("INVITATION_FROM_EMAIL missing.");
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
