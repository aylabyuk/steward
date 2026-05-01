import { getFirestore } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";
import { addChatParticipant, deleteConversation } from "./twilio/conversations.js";
import type { SpeakerInvitationShape } from "./invitationTypes.js";
import type { MemberDoc } from "./types.js";

export { tryEmail, trySms, sendInvitationSms } from "./invitationDelivery.js";
export type { EmailDeliveryParams } from "./invitationDelivery.js";

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
 *  for the same speaker would otherwise fail at the participant
 *  create call. (Cross-speaker phone conflicts are handled by
 *  `freePhoneBindingConflicts` at participant-create time.) */
export interface BishopricSnapshot {
  uid: string;
  displayName: string;
  role: "bishopric" | "clerk";
  email: string;
}

/** Adds every active bishopric/clerk member to the conversation and
 *  returns the snapshot the caller pins on the invitation doc — the
 *  invite page uses that list to label chat bubbles when Twilio
 *  attributes aren't available. Per-add failures are swallowed so the
 *  conversation stays usable with whichever adds succeeded. */
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
  const trimmed = origin.replace(/\/+$/, "");
  return `${trimmed}/invite/speaker/${wardId}/${invitationId}/${token}`;
}
