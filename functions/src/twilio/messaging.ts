import { logger } from "firebase-functions/v2";
import { redactInviteUrls } from "../invitationToken.js";
import { getTwilioClient } from "./client.js";
import { resolveFromNumber, type FromNumberMode } from "./fromNumber.js";

export interface SendSmsInput {
  to: string;
  body: string;
  /** Picks between TWILIO_FROM_NUMBER (default) and the testing
   *  fallback. See `fromNumber.ts`. */
  fromMode?: FromNumberMode;
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
export async function sendSmsDirect({ to, body, fromMode }: SendSmsInput): Promise<string> {
  if (process.env.STEWARD_DEV_STUB_SMS === "true") {
    // Mask the capability token in any invite URL before logging —
    // a logged URL is a usable credential until the speaker consumes
    // it. The body still shows everything else (template variables,
    // phrasing) so the emulator log remains useful for debugging.
    const safeBody = redactInviteUrls(body);
    const url = safeBody.match(/https?:\/\/\S+/)?.[0];
    logger.info("[SMS stub] would send", {
      to,
      body: safeBody,
      fromMode: fromMode ?? "production",
    });
    if (url) logger.info("[SMS stub] invite URL →", url);
    return `SM_stub_${Date.now()}`;
  }
  const from = resolveFromNumber(fromMode);
  const msg = await getTwilioClient().messages.create({ to, from, body });
  return msg.sid;
}
