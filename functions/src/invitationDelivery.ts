import { getFirestore } from "firebase-admin/firestore";
import { logger } from "firebase-functions/v2";
import { buildEmailHtml, buildEmailText } from "./invitationEmailBody.js";
import { interpolate, readMessageTemplate } from "./messageTemplates.js";
import { sendEmail } from "./sendgrid/client.js";
import { sendSmsDirect } from "./twilio/messaging.js";
import type { DeliveryEntry } from "./sendSpeakerInvitation.types.js";

type EmailArgs = Parameters<typeof buildEmailText>[0];

export interface EmailDeliveryParams {
  speakerEmail: string;
  inviterName: string;
  assignedDate: string;
  /** Reply-To used so a speaker replying to the email lands in the
   *  bishop's inbox naturally. On rotate-mode we don't have it on the
   *  invitation doc, so callers fall back to the speaker's own email. */
  replyToEmail: string;
}

export async function tryEmail(
  params: EmailDeliveryParams,
  args: EmailArgs,
): Promise<DeliveryEntry> {
  try {
    const messageId = await sendEmail({
      to: params.speakerEmail,
      fromDisplayName: `${params.inviterName} (via Steward)`,
      replyTo: params.replyToEmail,
      subject: `Speaking invitation — ${params.assignedDate}`,
      text: buildEmailText(args),
      html: buildEmailHtml(args),
    });
    const entry: DeliveryEntry = { channel: "email", status: "sent", at: new Date() };
    if (messageId) entry.providerId = messageId;
    return entry;
  } catch (err) {
    logger.error("email send failed", { err: (err as Error).message });
    return { channel: "email", status: "failed", error: (err as Error).message, at: new Date() };
  }
}

async function buildInitialInvitationSms(
  wardId: string,
  vars: Pick<EmailArgs, "inviterName" | "wardName" | "assignedDate" | "inviteUrl">,
): Promise<string> {
  const template = await readMessageTemplate(getFirestore(), wardId, "initialInvitationSms");
  return interpolate(template, vars);
}

export async function trySms(
  wardId: string,
  speakerPhone: string,
  emailArgs: EmailArgs,
): Promise<DeliveryEntry> {
  try {
    const body = await buildInitialInvitationSms(wardId, emailArgs);
    const sid = await sendSmsDirect({ to: speakerPhone, body });
    return { channel: "sms", status: "sent", providerId: sid, at: new Date() };
  } catch (err) {
    logger.error("initial SMS send failed", { err: (err as Error).message });
    return { channel: "sms", status: "failed", error: (err as Error).message, at: new Date() };
  }
}

/** Send the invitation letter via SMS (Twilio). Used both by the
 *  initial sendSpeakerInvitation flow and by issueSpeakerSession's
 *  rotation path when a consumed/expired token is presented. */
export async function sendInvitationSms(args: {
  wardId: string;
  speakerPhone: string;
  inviterName: string;
  wardName: string;
  assignedDate: string;
  speakerName: string;
  inviteUrl: string;
}): Promise<{ providerId: string }> {
  const body = await buildInitialInvitationSms(args.wardId, args);
  const sid = await sendSmsDirect({ to: args.speakerPhone, body });
  return { providerId: sid };
}
