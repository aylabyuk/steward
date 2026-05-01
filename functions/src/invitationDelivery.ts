import { getFirestore } from "firebase-admin/firestore";
import { logger } from "firebase-functions/v2";
import {
  buildEmailHtmlFromTemplate,
  buildEmailTextFromTemplate,
  type EmailKind,
  type EmailTemplateVars,
  readEmailTemplate,
} from "./emailTemplateBody.js";
import { interpolate, readMessageTemplate } from "./messageTemplates.js";
import { sendEmail } from "./sendgrid/client.js";
import { sendSmsDirect } from "./twilio/messaging.js";
import type { FromNumberMode } from "./twilio/fromNumber.js";
import type { DeliveryEntry } from "./sendSpeakerInvitation.types.js";

export interface EmailArgs {
  speakerName: string;
  inviterName: string;
  assignedDate: string;
  wardName: string;
  inviteUrl: string;
  /** Speaker assignment topic (free text). Speaker invitations only;
   *  exposed so a bishopric-authored email template can reference
   *  `{{topic}}`. */
  topic?: string;
  /** Set for prayer invitations — e.g. "opening prayer" or
   *  "closing prayer". Drives kind dispatch (speaker vs prayer
   *  template + subject line) and powers `{{prayerType}}` in the body. */
  prayerType?: string;
}

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
  wardId: string,
  params: EmailDeliveryParams,
  args: EmailArgs,
): Promise<DeliveryEntry> {
  try {
    const kind: EmailKind = args.prayerType ? "prayer" : "speaker";
    const subject = args.prayerType
      ? `Prayer invitation — ${params.assignedDate}`
      : `Speaking invitation — ${params.assignedDate}`;
    const body = await readEmailTemplate(getFirestore(), wardId, kind);
    const vars: EmailTemplateVars = {
      speakerName: args.speakerName,
      date: args.assignedDate,
      wardName: args.wardName,
      inviterName: args.inviterName,
      inviteUrl: args.inviteUrl,
      ...(args.topic ? { topic: args.topic } : {}),
      ...(args.prayerType ? { prayerType: args.prayerType } : {}),
    };
    const messageId = await sendEmail({
      to: params.speakerEmail,
      fromDisplayName: `${params.inviterName} (via Steward)`,
      replyTo: params.replyToEmail,
      subject,
      text: buildEmailTextFromTemplate(body, vars),
      html: buildEmailHtmlFromTemplate(body, vars),
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
  vars: Pick<EmailArgs, "inviterName" | "wardName" | "assignedDate" | "inviteUrl"> & {
    prayerType?: string;
  },
): Promise<string> {
  const key = vars.prayerType ? "prayerInitialInvitationSms" : "initialInvitationSms";
  const template = await readMessageTemplate(getFirestore(), wardId, key);
  return interpolate(template, vars);
}

export async function trySms(
  wardId: string,
  speakerPhone: string,
  emailArgs: EmailArgs,
  fromMode?: FromNumberMode,
): Promise<DeliveryEntry> {
  try {
    const body = await buildInitialInvitationSms(wardId, emailArgs);
    const sid = await sendSmsDirect({
      to: speakerPhone,
      body,
      ...(fromMode ? { fromMode } : {}),
    });
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
  fromMode?: FromNumberMode;
}): Promise<{ providerId: string }> {
  const body = await buildInitialInvitationSms(args.wardId, args);
  const sid = await sendSmsDirect({
    to: args.speakerPhone,
    body,
    ...(args.fromMode ? { fromMode: args.fromMode } : {}),
  });
  return { providerId: sid };
}
