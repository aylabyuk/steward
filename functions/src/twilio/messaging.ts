import { getTwilioClient } from "./client.js";

export interface SendSmsInput {
  to: string;
  body: string;
}

/** One-off SMS via Twilio's Messaging REST API. Independent of
 *  Conversations — use this for texts that aren't tied to a
 *  participant binding (initial invite delivery; bishop-reply
 *  notifications when the speaker has no active chat session).
 *  Returns the Twilio message SID on success; throws otherwise. */
export async function sendSmsDirect({ to, body }: SendSmsInput): Promise<string> {
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!from) throw new Error("TWILIO_FROM_NUMBER missing.");
  const msg = await getTwilioClient().messages.create({ to, from, body });
  return msg.sid;
}
