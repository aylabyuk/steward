import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { addChatParticipant, createConversation } from "./twilio/conversations.js";
import {
  addBishopricParticipants,
  buildInviteUrl,
  cleanupPriorConversations,
  tryEmail,
  trySms,
} from "./sendSpeakerInvitation.helpers.js";
import { generateInvitationToken, hashInvitationToken } from "./invitationToken.js";
import type {
  DeliveryEntry,
  FreshInvitationRequest,
  FreshInvitationResponse,
} from "./sendSpeakerInvitation.types.js";

/** Create-new path: builds a new invitation doc + conversation,
 *  delivers via chosen channels, and returns the new invitationId
 *  plus conversationSid. The rotate path shares helpers but a fresh
 *  send always starts from scratch (prior Twilio conversations for
 *  the same speaker+date get cleaned up). */
export async function createFreshInvitation(
  input: FreshInvitationRequest,
  origin: string,
): Promise<FreshInvitationResponse> {
  const db = getFirestore();
  const wantsEmail = input.channels.includes("email") && Boolean(input.speakerEmail);
  const wantsSms = input.channels.includes("sms") && Boolean(input.speakerPhone);

  await cleanupPriorConversations(input.wardId, input.speakerId, input.meetingDate);

  const conversationSid = await createConversation({
    friendlyName: `${input.speakerName} — ${input.meetingDate}`,
    attributes: { wardId: input.wardId, speakerId: input.speakerId },
  });
  const bishopricParticipants = await addBishopricParticipants(input.wardId, conversationSid);

  const plaintextToken = generateInvitationToken();
  const tokenHash = hashInvitationToken(plaintextToken);
  const expiresAt = new Date(input.expiresAtMillis);

  // Admin SDK rejects `undefined` field values by default, so only
  // include the optional contact/topic fields when the caller actually
  // provided them. Missing fields read as `undefined` downstream,
  // which is what the rest of the code already expects.
  const docRef = await db.collection(`wards/${input.wardId}/speakerInvitations`).add({
    speakerRef: { meetingDate: input.meetingDate, speakerId: input.speakerId },
    assignedDate: input.assignedDate,
    sentOn: input.sentOn,
    wardName: input.wardName,
    speakerName: input.speakerName,
    ...(input.speakerTopic ? { speakerTopic: input.speakerTopic } : {}),
    inviterName: input.inviterName,
    bodyMarkdown: input.bodyMarkdown,
    footerMarkdown: input.footerMarkdown,
    ...(input.speakerEmail ? { speakerEmail: input.speakerEmail } : {}),
    ...(input.speakerPhone ? { speakerPhone: input.speakerPhone } : {}),
    expiresAt,
    tokenHash,
    tokenStatus: "active" as const,
    tokenExpiresAt: expiresAt,
    tokenRotationsByDay: {},
    conversationSid,
    deliveryRecord: [],
    bishopricParticipants,
    createdAt: FieldValue.serverTimestamp(),
  });

  await addChatParticipant(conversationSid, `speaker:${docRef.id}`, {
    displayName: input.speakerName,
    role: "speaker",
  });

  const inviteUrl = buildInviteUrl(origin, input.wardId, docRef.id, plaintextToken);
  const emailArgs = {
    speakerName: input.speakerName,
    inviterName: input.inviterName,
    assignedDate: input.assignedDate,
    wardName: input.wardName,
    inviteUrl,
  };

  const deliveryRecord: DeliveryEntry[] = [];
  if (wantsEmail) {
    deliveryRecord.push(
      await tryEmail(
        {
          speakerEmail: input.speakerEmail!,
          inviterName: input.inviterName,
          assignedDate: input.assignedDate,
          replyToEmail: input.bishopReplyToEmail,
        },
        emailArgs,
      ),
    );
  }
  if (wantsSms) deliveryRecord.push(await trySms(input.wardId, input.speakerPhone!, emailArgs));
  await docRef.update({ deliveryRecord });

  return { mode: "fresh", token: docRef.id, conversationSid, deliveryRecord };
}
