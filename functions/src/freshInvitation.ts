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
import { invitationPrayerType } from "./invitationTypes.js";
import { stampParticipantInvited } from "./stampParticipantInvited.js";
import type { FromNumberMode } from "./twilio/fromNumber.js";
import type {
  DeliveryEntry,
  FreshInvitationRequest,
  FreshInvitationResponse,
} from "./sendSpeakerInvitation.types.js";

/** Create-new path: builds a new invitation doc + conversation,
 *  delivers via chosen channels, and returns the new invitationId
 *  plus conversationSid. The rotate path shares helpers but a fresh
 *  send always starts from scratch (prior Twilio conversations for
 *  the same speaker+date get cleaned up).
 *
 *  Also flips the participant doc's `status` to "invited" + mirrors
 *  the name onto the inline `meeting.{role}.person` (prayer kind)
 *  server-side. This is the source-of-truth alignment between iOS
 *  and web — without it, the participant.status only got updated by
 *  whichever client did a follow-up `upsertPrayerParticipant` /
 *  `updateSpeaker` call after the send, and clients that skipped
 *  that step left the status stale at "planned" while the
 *  invitation existed. The client-side post-send writes still run
 *  (idempotent), but the function now guarantees consistency on
 *  every send regardless of caller. */
export async function createFreshInvitation(
  input: FreshInvitationRequest,
  origin: string,
  fromNumberMode: FromNumberMode,
  bishopUid: string,
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
  const isPrayer = input.kind === "prayer";
  const docRef = await db.collection(`wards/${input.wardId}/speakerInvitations`).add({
    speakerRef: { meetingDate: input.meetingDate, speakerId: input.speakerId },
    // Persist `kind` only for non-default ("prayer") rows so the doc
    // shape stays clean for every speaker send. Readers default
    // missing-field to "speaker" via the Zod schema.
    ...(isPrayer ? { kind: "prayer", prayerRole: input.prayerRole } : {}),
    assignedDate: input.assignedDate,
    sentOn: input.sentOn,
    wardName: input.wardName,
    speakerName: input.speakerName,
    ...(input.speakerTopic ? { speakerTopic: input.speakerTopic } : {}),
    inviterName: input.inviterName,
    bodyMarkdown: input.bodyMarkdown,
    footerMarkdown: input.footerMarkdown,
    ...(input.editorStateJson ? { editorStateJson: input.editorStateJson } : {}),
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
    // Persist only when non-default — keeps the doc shape clean for
    // every normal send and lets downstream code treat absence as
    // "production". The webhook's smsSpeaker + the rotation path in
    // issueSpeakerSession both read this back.
    ...(fromNumberMode === "testing" ? { fromNumberMode } : {}),
    createdAt: FieldValue.serverTimestamp(),
  });

  // Speaker is added as a chat-identity participant only — no SMS-only
  // participant. Inbound speaker SMS replies arrive at the Programmable
  // Messaging webhook and are relayed into this conversation
  // server-side by `inboundSmsRelay` (authored as `speaker:{id}`).
  // Outbound bishop → speaker SMS is server-driven via `smsSpeaker`
  // ([invitationReplyNotify.ts]). Avoiding the SMS-only participant
  // sidesteps Twilio's auto-broadcast of chat messages back to the
  // speaker's phone (the echo behind #227) and the duplicate SMS that
  // would arrive when both auto-broadcast and `smsSpeaker` ran.
  await addChatParticipant(conversationSid, `speaker:${docRef.id}`, {
    displayName: input.speakerName,
    role: "speaker",
  });

  await stampParticipantInvited({
    db,
    wardId: input.wardId,
    meetingDate: input.meetingDate,
    speakerId: input.speakerId,
    speakerName: input.speakerName,
    isPrayer,
    ...(input.prayerRole ? { prayerRole: input.prayerRole } : {}),
    invitationId: docRef.id,
    conversationSid,
    bishopUid,
  });

  const inviteUrl = buildInviteUrl(origin, input.wardId, docRef.id, plaintextToken);
  const prayerType =
    isPrayer && input.prayerRole
      ? invitationPrayerType({ kind: "prayer", prayerRole: input.prayerRole })
      : undefined;
  const emailArgs = {
    speakerName: input.speakerName,
    inviterName: input.inviterName,
    assignedDate: input.assignedDate,
    wardName: input.wardName,
    inviteUrl,
    ...(input.speakerTopic ? { topic: input.speakerTopic } : {}),
    ...(prayerType ? { prayerType } : {}),
  };

  const deliveryRecord: DeliveryEntry[] = [];
  if (wantsEmail) {
    deliveryRecord.push(
      await tryEmail(
        input.wardId,
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
  if (wantsSms)
    deliveryRecord.push(await trySms(input.wardId, input.speakerPhone!, emailArgs, fromNumberMode));
  await docRef.update({ deliveryRecord });

  return { mode: "fresh", token: docRef.id, conversationSid, deliveryRecord };
}
