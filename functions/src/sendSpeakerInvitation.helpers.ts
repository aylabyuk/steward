import { getFirestore } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";
import { sendEmail } from "./sendgrid/client.js";
import { addChatParticipant, deleteConversation } from "./twilio/conversations.js";
import { sendSmsDirect } from "./twilio/messaging.js";
import { buildEmailHtml, buildEmailText, buildSmsBody } from "./invitationEmailBody.js";
import type { SpeakerInvitationShape } from "./invitationTypes.js";
import type { DeliveryEntry, SendSpeakerInvitationRequest } from "./sendSpeakerInvitation.types.js";
import type { MemberDoc } from "./types.js";

export async function assertActiveMember(wardId: string, uid: string): Promise<void> {
  const snap = await getFirestore().doc(`wards/${wardId}/members/${uid}`).get();
  if (!snap.exists) throw new HttpsError("permission-denied", "Not a ward member.");
  if ((snap.data() as MemberDoc).active !== true) {
    throw new HttpsError("permission-denied", "Inactive member.");
  }
}

/** Frees the speaker's phone binding from any earlier Twilio
 *  Conversation for this (wardId, speakerId, meetingDate). Twilio
 *  refuses to bind the same (phone, proxy) pair twice, so a re-send
 *  for the same speaker would otherwise fail at addSmsParticipant. */
export interface BishopricSnapshot {
  uid: string;
  displayName: string;
  role: "bishopric" | "clerk";
  email: string;
}

/** Pulls every active bishopric + clerk member from the ward and
 *  adds them to the new conversation with displayName + role
 *  attributes. Returns the list of successfully-added members so
 *  the caller can snapshot it onto the invitation doc — the
 *  speaker's public invite page uses that snapshot to label chat
 *  bubbles when Twilio attributes aren't available (e.g. older
 *  conversations, or while the client is still loading).
 *  Per-add failures are logged and swallowed; the conversation
 *  stays usable with whichever participants succeeded. */
export async function addBishopricParticipants(
  wardId: string,
  conversationSid: string,
): Promise<BishopricSnapshot[]> {
  const snap = await getFirestore().collection(`wards/${wardId}/members`).get();
  const added: BishopricSnapshot[] = [];
  for (const doc of snap.docs) {
    const member = doc.data() as MemberDoc;
    if (!member.active) continue;
    if (member.role !== "bishopric" && member.role !== "clerk") continue;
    try {
      await addChatParticipant(conversationSid, `uid:${doc.id}`, {
        displayName: member.displayName,
        role: member.role,
        email: member.email,
      });
      added.push({
        uid: doc.id,
        displayName: member.displayName,
        role: member.role,
        email: member.email,
      });
    } catch (err) {
      logger.warn("failed to add chat participant", {
        uid: doc.id,
        err: (err as Error).message,
      });
    }
  }
  return added;
}

export async function cleanupPriorConversations(
  wardId: string,
  speakerId: string,
  meetingDate: string,
): Promise<void> {
  const snap = await getFirestore()
    .collection(`wards/${wardId}/speakerInvitations`)
    .where("speakerRef.speakerId", "==", speakerId)
    .where("speakerRef.meetingDate", "==", meetingDate)
    .get();
  const sids = snap.docs
    .map((d) => (d.data() as SpeakerInvitationShape).conversationSid)
    .filter((s): s is string => Boolean(s));
  for (const sid of sids) {
    try {
      await deleteConversation(sid);
    } catch (err) {
      logger.warn("failed to delete prior conversation", { sid, err: (err as Error).message });
    }
  }
}

type EmailArgs = Parameters<typeof buildEmailText>[0];

export async function tryEmail(
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

export async function trySms(speakerPhone: string, emailArgs: EmailArgs): Promise<DeliveryEntry> {
  try {
    const sid = await sendSmsDirect({ to: speakerPhone, body: buildSmsBody(emailArgs) });
    return { channel: "sms", status: "sent", providerId: sid, at: new Date() };
  } catch (err) {
    logger.error("initial SMS send failed", { err: (err as Error).message });
    return { channel: "sms", status: "failed", error: (err as Error).message, at: new Date() };
  }
}

/** Build a speaker invite URL from its three parts. The `:invitationId`
 *  path segment is the stable Firestore doc ID; `:token` is the
 *  rotating capability value. Keeping them separate lets the landing
 *  page do a direct public read of the letter by doc ID before
 *  presenting the token to issueSpeakerSession. */
export function buildInviteUrl(
  origin: string,
  wardId: string,
  invitationId: string,
  token: string,
): string {
  return `${origin}/invite/speaker/${wardId}/${invitationId}/${token}`;
}

/** Send the invitation letter via SMS (Twilio). Used both by the
 *  initial sendSpeakerInvitation flow and by issueSpeakerSession's
 *  rotation path when a consumed/expired token is presented. */
export async function sendInvitationSms(args: {
  speakerPhone: string;
  inviterName: string;
  wardName: string;
  assignedDate: string;
  speakerName: string;
  inviteUrl: string;
}): Promise<{ providerId: string }> {
  const sid = await sendSmsDirect({
    to: args.speakerPhone,
    body: buildSmsBody({
      speakerName: args.speakerName,
      inviterName: args.inviterName,
      assignedDate: args.assignedDate,
      wardName: args.wardName,
      inviteUrl: args.inviteUrl,
    }),
  });
  return { providerId: sid };
}
