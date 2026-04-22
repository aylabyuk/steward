import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { HttpsError, onCall, type CallableRequest } from "firebase-functions/v2/https";
import { STEWARD_ORIGIN, TWILIO_SECRETS } from "./secrets.js";
import { addChatParticipant, createConversation } from "./twilio/conversations.js";
import {
  addBishopricParticipants,
  assertActiveMember,
  cleanupPriorConversations,
  tryEmail,
  trySms,
} from "./sendSpeakerInvitation.helpers.js";
import type {
  DeliveryEntry,
  SendSpeakerInvitationRequest,
  SendSpeakerInvitationResponse,
} from "./sendSpeakerInvitation.types.js";

export const sendSpeakerInvitation = onCall(
  // SendGrid secrets are intentionally omitted — we're shipping SMS-only
  // for v1. If the bishop asks for email delivery, the server attempts
  // sendEmail() which throws on the missing key; the surrounding
  // try/catch records the failure in deliveryRecord and the SMS path
  // continues unaffected.
  { secrets: TWILIO_SECRETS },
  async (
    request: CallableRequest<SendSpeakerInvitationRequest>,
  ): Promise<SendSpeakerInvitationResponse> => {
    const input = request.data;
    const auth = request.auth;
    if (!auth) throw new HttpsError("unauthenticated", "Sign-in required.");
    await assertActiveMember(input.wardId, auth.uid);

    const db = getFirestore();
    const wantsEmail = input.channels.includes("email") && Boolean(input.speakerEmail);
    const wantsSms = input.channels.includes("sms") && Boolean(input.speakerPhone);

    // Free the speaker's phone number from any prior conversation for
    // this (wardId, speakerId, meetingDate) — Twilio refuses to bind
    // the same (phone, proxy) pair twice. Swallow per-deletion errors
    // so one stale/missing SID doesn't block the re-send path.
    await cleanupPriorConversations(input.wardId, input.speakerId, input.meetingDate);

    const conversationSid = await createConversation({
      friendlyName: `${input.speakerName} — ${input.meetingDate}`,
      attributes: { wardId: input.wardId, speakerId: input.speakerId },
    });
    // Group-chat model: every active bishopric + clerk joins, each
    // carrying their displayName via participant attributes so the
    // speaker's UI can label message bubbles with real names.
    const bishopricParticipants = await addBishopricParticipants(input.wardId, conversationSid);

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
      bishopricParticipants,
      createdAt: FieldValue.serverTimestamp(),
    });

    // Speaker's Twilio identity = `speaker:{invitationToken}`. Same
    // identity the JWT minted by issueTwilioToken carries, so the URL
    // token alone is enough for the speaker to join as a chat
    // participant. displayName attribute drives the bubble label in
    // the bishopric's chat UI.
    await addChatParticipant(conversationSid, `speaker:${docRef.id}`, {
      displayName: input.speakerName,
      role: "speaker",
    });

    const origin = process.env.STEWARD_ORIGIN ?? STEWARD_ORIGIN.value();
    const emailArgs = {
      speakerName: input.speakerName,
      inviterName: input.inviterName,
      assignedDate: input.assignedDate,
      wardName: input.wardName,
      inviteUrl: `${origin}/invite/speaker/${input.wardId}/${docRef.id}`,
    };

    const deliveryRecord: DeliveryEntry[] = [];
    if (wantsEmail) deliveryRecord.push(await tryEmail(input, emailArgs));
    if (wantsSms) deliveryRecord.push(await trySms(input.speakerPhone!, emailArgs));
    await docRef.update({ deliveryRecord });

    return { token: docRef.id, conversationSid, deliveryRecord };
  },
);
