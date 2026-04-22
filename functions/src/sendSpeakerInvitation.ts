import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { HttpsError, onCall, type CallableRequest } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";
import { SENDGRID_SECRETS, STEWARD_ORIGIN, TWILIO_SECRETS } from "./secrets.js";
import {
  addChatParticipant,
  addSmsParticipant,
  createConversation,
  postMessage,
} from "./twilio/conversations.js";
import { sendEmail } from "./sendgrid/client.js";
import { buildEmailHtml, buildEmailText, buildSmsBody } from "./invitationEmailBody.js";
import type {
  DeliveryEntry,
  SendSpeakerInvitationRequest,
  SendSpeakerInvitationResponse,
} from "./sendSpeakerInvitation.types.js";
import type { MemberDoc } from "./types.js";

export const sendSpeakerInvitation = onCall(
  { secrets: [...TWILIO_SECRETS, ...SENDGRID_SECRETS] },
  async (
    request: CallableRequest<SendSpeakerInvitationRequest>,
  ): Promise<SendSpeakerInvitationResponse> => {
    const input = request.data;
    const auth = request.auth;
    if (!auth) throw new HttpsError("unauthenticated", "Sign-in required.");
    await assertActiveMember(input.wardId, auth.uid);

    const db = getFirestore();
    const wantsEmail = input.channels.includes("email") && !!input.speakerEmail;
    const wantsSms = input.channels.includes("sms") && !!input.speakerPhone;

    const conversationSid = await createConversation({
      friendlyName: `${input.speakerName} — ${input.meetingDate}`,
      attributes: { wardId: input.wardId, speakerId: input.speakerId },
    });
    await addChatParticipant(conversationSid, `uid:${auth.uid}`);
    if (wantsSms) await tryAddSms(conversationSid, input.speakerPhone!);

    const docRef = await db.collection(`wards/${input.wardId}/speakerInvitations`).add({
      speakerRef: { meetingDate: input.meetingDate, speakerId: input.speakerId },
      assignedDate: input.assignedDate,
      sentOn: input.sentOn,
      wardName: input.wardName,
      speakerName: input.speakerName,
      speakerTopic: input.speakerTopic,
      inviterName: input.inviterName,
      bodyMarkdown: input.bodyMarkdown,
      footerMarkdown: input.footerMarkdown,
      speakerEmail: input.speakerEmail,
      speakerPhone: input.speakerPhone,
      expiresAt: new Date(input.expiresAtMillis),
      conversationSid,
      deliveryRecord: [],
      createdAt: FieldValue.serverTimestamp(),
    });

    const origin = process.env.STEWARD_ORIGIN ?? STEWARD_ORIGIN.value();
    const inviteUrl = `${origin}/invite/speaker/${input.wardId}/${docRef.id}`;
    const emailArgs = {
      speakerName: input.speakerName,
      inviterName: input.inviterName,
      assignedDate: input.assignedDate,
      wardName: input.wardName,
      inviteUrl,
    };

    const deliveryRecord: DeliveryEntry[] = [];
    if (wantsEmail) {
      deliveryRecord.push(await tryEmail(input, emailArgs));
    }
    if (wantsSms) {
      deliveryRecord.push(
        await trySms(conversationSid, `uid:${auth.uid}`, buildSmsBody(emailArgs)),
      );
    }
    await docRef.update({ deliveryRecord });

    return { token: docRef.id, conversationSid, deliveryRecord };
  },
);

async function assertActiveMember(wardId: string, uid: string): Promise<void> {
  const snap = await getFirestore().doc(`wards/${wardId}/members/${uid}`).get();
  if (!snap.exists) throw new HttpsError("permission-denied", "Not a ward member.");
  if ((snap.data() as MemberDoc).active !== true) {
    throw new HttpsError("permission-denied", "Inactive member.");
  }
}

async function tryAddSms(conversationSid: string, speakerPhone: string): Promise<void> {
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!from) throw new HttpsError("failed-precondition", "TWILIO_FROM_NUMBER missing.");
  try {
    await addSmsParticipant(conversationSid, speakerPhone, from);
  } catch (err) {
    logger.warn("failed to add SMS participant", { err: (err as Error).message });
  }
}

type EmailArgs = Parameters<typeof buildEmailText>[0];

async function tryEmail(
  input: SendSpeakerInvitationRequest,
  args: EmailArgs,
): Promise<DeliveryEntry> {
  try {
    const messageId = await sendEmail({
      to: input.speakerEmail!,
      fromDisplayName: `${input.inviterName} (via Steward)`,
      replyTo: input.bishopReplyToEmail,
      subject: `Speaking invitation — ${input.assignedDate}`,
      text: buildEmailText(args),
      html: buildEmailHtml(args),
    });
    const entry: DeliveryEntry = { channel: "email", status: "sent", at: new Date() };
    if (messageId) entry.providerId = messageId;
    return entry;
  } catch (err) {
    logger.error("initial email send failed", { err: (err as Error).message });
    return { channel: "email", status: "failed", error: (err as Error).message, at: new Date() };
  }
}

async function trySms(
  conversationSid: string,
  authorIdentity: string,
  body: string,
): Promise<DeliveryEntry> {
  try {
    const sid = await postMessage({
      conversationSid,
      author: authorIdentity,
      body,
      attributes: { kind: "invitation" },
    });
    return { channel: "sms", status: "sent", providerId: sid, at: new Date() };
  } catch (err) {
    logger.error("initial SMS send failed", { err: (err as Error).message });
    return { channel: "sms", status: "failed", error: (err as Error).message, at: new Date() };
  }
}
