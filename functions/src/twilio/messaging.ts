import { logger } from "firebase-functions/v2";
import { getTwilioClient } from "./client.js";

export interface SendSmsInput {
  to: string;
  body: string;
}

/** One-off SMS via Twilio's Messaging REST API. Independent of
 *  Conversations — use this for texts that aren't tied to a
 *  participant binding (initial invite delivery; bishop-reply
 *  notifications when the speaker has no active chat session).
 *  Returns the Twilio message SID on success; throws otherwise.
 *
 *  Dev stub: when `STEWARD_DEV_STUB_SMS=true` (only set in
 *  functions/.env.local, loaded by the emulator), we skip the Twilio
 *  REST call, log the body + any invite URL we detect in it, and
 *  return a fake SID. Lets the full flow run offline against the
 *  emulator without burning SMS budget. The Conversations path
 *  (chat JWTs, participants) still uses real Twilio creds. */
export async function sendSmsDirect({ to, body }: SendSmsInput): Promise<string> {
  if (process.env.STEWARD_DEV_STUB_SMS === "true") {
    const url = body.match(/https?:\/\/\S+/)?.[0];
    logger.info("[SMS stub] would send", { to, body });
    if (url) logger.info("[SMS stub] invite URL →", url);
    return `SM_stub_${Date.now()}`;
  }
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!from) throw new Error("TWILIO_FROM_NUMBER missing.");
  const msg = await getTwilioClient().messages.create({ to, from, body });
  return msg.sid;
}
