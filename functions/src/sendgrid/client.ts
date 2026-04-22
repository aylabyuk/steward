import sgMail from "@sendgrid/mail";

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
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail(input: EmailInput): Promise<string | null> {
  ensureConfigured();
  const fromAddress = process.env.INVITATION_FROM_EMAIL;
  if (!fromAddress) throw new Error("INVITATION_FROM_EMAIL missing.");
  const [res] = await sgMail.send({
    to: input.to,
    from: { email: fromAddress, name: input.fromDisplayName },
    subject: input.subject,
    text: input.text,
    ...(input.replyTo ? { replyTo: input.replyTo } : {}),
    ...(input.html ? { html: input.html } : {}),
  });
  return res.headers["x-message-id"] ?? null;
}

/** Reset for tests. */
export function resetSendgridForTests(): void {
  configured = false;
}
