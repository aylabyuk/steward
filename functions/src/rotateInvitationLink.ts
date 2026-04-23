import { getFirestore } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { buildInviteUrl, tryEmail, trySms } from "./sendSpeakerInvitation.helpers.js";
import { generateInvitationToken, hashInvitationToken } from "./invitationToken.js";
import type { SpeakerInvitationShape } from "./invitationTypes.js";
import type {
  DeliveryEntry,
  RotateInvitationRequest,
  RotateInvitationResponse,
} from "./sendSpeakerInvitation.types.js";

/** Bishop-driven link rotation. Generates a new capability token on
 *  an existing invitation, preserving conversationSid + chat history
 *  + bishopricParticipants snapshot + any prior response. Returns the
 *  plaintext URL once; Firestore keeps only the new hash.
 *
 *  Bishop-driven rotations don't count against ROTATION_DAILY_CAP —
 *  that cap exists to limit SMS-cost exposure from a leaked link,
 *  not to restrict the owner of the invitation. */
export async function rotateInvitationLink(
  input: RotateInvitationRequest,
  origin: string,
): Promise<RotateInvitationResponse> {
  const db = getFirestore();
  const ref = db.doc(`wards/${input.wardId}/speakerInvitations/${input.invitationId}`);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError("not-found", "Invitation not found.");
  const invitation = snap.data() as SpeakerInvitationShape;
  const expiresAtMillis = invitation.expiresAt?.toMillis();
  if (typeof expiresAtMillis === "number" && expiresAtMillis < Date.now()) {
    throw new HttpsError(
      "failed-precondition",
      "Invitation has expired — start a fresh one instead.",
    );
  }

  const plaintextToken = generateInvitationToken();
  const tokenHash = hashInvitationToken(plaintextToken);
  await ref.update({ tokenHash, tokenStatus: "active" as const });

  const inviteUrl = buildInviteUrl(origin, input.wardId, input.invitationId, plaintextToken);
  const deliveryRecord = await deliverIfRequested(input, invitation, inviteUrl);
  if (deliveryRecord.length > 0) {
    await ref.update({
      deliveryRecord: [...(invitation.deliveryRecord ?? []), ...deliveryRecord],
    });
  }

  return { mode: "rotate", inviteUrl, deliveryRecord };
}

async function deliverIfRequested(
  input: RotateInvitationRequest,
  invitation: SpeakerInvitationShape,
  inviteUrl: string,
): Promise<DeliveryEntry[]> {
  const out: DeliveryEntry[] = [];
  const emailArgs = {
    speakerName: invitation.speakerName,
    inviterName: invitation.inviterName,
    assignedDate: invitation.assignedDate,
    wardName: invitation.wardName,
    inviteUrl,
  };
  if (input.channels.includes("email") && invitation.speakerEmail) {
    out.push(
      await tryEmail(
        {
          speakerEmail: invitation.speakerEmail,
          inviterName: invitation.inviterName,
          assignedDate: invitation.assignedDate,
          // bishopReplyToEmail isn't persisted on the invitation doc;
          // fall back to the speaker's own address so SendGrid has a
          // valid Reply-To header. Speakers replying that way reach
          // themselves, which is a no-op — acceptable fallback.
          replyToEmail: invitation.speakerEmail,
        },
        emailArgs,
      ),
    );
  }
  if (input.channels.includes("sms") && invitation.speakerPhone) {
    out.push(await trySms(invitation.speakerPhone, emailArgs));
  }
  return out;
}
