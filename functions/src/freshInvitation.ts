import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { logger } from "firebase-functions/v2";
import {
  addSpeakerParticipant,
  createConversation,
  freePhoneBindingConflicts,
} from "./twilio/conversations.js";
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
import { resolveFromNumber, type FromNumberMode } from "./twilio/fromNumber.js";
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

  // Add the speaker as a single participant carrying BOTH the chat
  // identity AND (when phone on file) the SMS messagingBinding.
  // Two-participant setups echo the speaker's web-side answer back
  // to their own phone via SMS — Twilio can't tell the chat-identity
  // participant and the SMS-binding participant are the same human,
  // so it broadcasts to all bindings. Combining them on one
  // participant lets Twilio de-dup automatically.
  //
  // Twilio enforces uniqueness on (phone, proxyAddress) across all
  // active conversations, so free any existing binding for this
  // phone first. Fail-soft: if the create itself fails (bad phone
  // format, cross-border 10DLC block, etc.), log and continue with
  // a chat-only participant — invite SMS still delivers separately
  // via `trySms` below.
  const proxyAddress = input.speakerPhone ? resolveFromNumber(fromNumberMode) : undefined;
  if (input.speakerPhone && proxyAddress) {
    await freePhoneBindingConflicts(input.speakerPhone, proxyAddress);
  }
  try {
    await addSpeakerParticipant(
      conversationSid,
      `speaker:${docRef.id}`,
      { displayName: input.speakerName, role: "speaker" },
      input.speakerPhone && proxyAddress
        ? { speakerPhoneE164: input.speakerPhone, twilioFromNumber: proxyAddress }
        : undefined,
    );
  } catch (err) {
    logger.warn("failed to add speaker participant with SMS binding — falling back to chat-only", {
      speakerId: input.speakerId,
      meetingDate: input.meetingDate,
      err: (err as Error).message,
    });
    // Fallback: at least make the chat side work so the bishop UI
    // can see the speaker's identity if anything else fires.
    try {
      await addSpeakerParticipant(conversationSid, `speaker:${docRef.id}`, {
        displayName: input.speakerName,
        role: "speaker",
      });
    } catch (chatErr) {
      logger.warn("chat-only fallback also failed", {
        speakerId: input.speakerId,
        meetingDate: input.meetingDate,
        err: (chatErr as Error).message,
      });
    }
  }

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
