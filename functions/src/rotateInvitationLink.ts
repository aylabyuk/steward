import { FieldValue, getFirestore } from "firebase-admin/firestore";
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
 *  + bishopricParticipants snapshot + any prior response. The
 *  plaintext URL is embedded in the SMS/email body and never returned
 *  to the caller — only the delivery outcome travels back.
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

  // Refresh the speakerEmail + speakerPhone snapshot from the live
  // speaker doc before we build the delivery payload. Without this,
  // a bishop correcting a typo in the speaker's phone number and then
  // hitting Resend would still deliver to the stale number on the
  // invitation doc. The rest of the letter (name, date, wardName,
  // inviterName) stays frozen — only delivery channels refresh.
  const liveContact =
    input.channels.length > 0 ? await readLiveContactInfo(db, input.wardId, invitation) : null;
  const writePatch = liveContact ? contactWritePatch(liveContact) : {};
  const effectiveContact: Pick<SpeakerInvitationShape, "speakerEmail" | "speakerPhone"> =
    liveContact ?? {
      ...(invitation.speakerEmail ? { speakerEmail: invitation.speakerEmail } : {}),
      ...(invitation.speakerPhone ? { speakerPhone: invitation.speakerPhone } : {}),
    };

  await ref.update({ tokenHash, tokenStatus: "active" as const, ...writePatch });

  const inviteUrl = buildInviteUrl(origin, input.wardId, input.invitationId, plaintextToken);
  const freshInvitation: SpeakerInvitationShape = { ...invitation, ...effectiveContact };
  const deliveryRecord = await deliverIfRequested(input, freshInvitation, inviteUrl);
  if (deliveryRecord.length > 0) {
    await ref.update({
      deliveryRecord: [...(invitation.deliveryRecord ?? []), ...deliveryRecord],
    });
  }

  return { mode: "rotate", deliveryRecord };
}

interface LiveContact {
  speakerEmail?: string;
  speakerPhone?: string;
}

async function readLiveContactInfo(
  db: FirebaseFirestore.Firestore,
  wardId: string,
  invitation: SpeakerInvitationShape,
): Promise<LiveContact | null> {
  const { meetingDate, speakerId } = invitation.speakerRef;
  const speakerRef = db.doc(`wards/${wardId}/meetings/${meetingDate}/speakers/${speakerId}`);
  const snap = await speakerRef.get();
  if (!snap.exists) return null;
  const speaker = snap.data() as { email?: string; phone?: string };
  const out: LiveContact = {};
  if (speaker.email) out.speakerEmail = speaker.email;
  if (speaker.phone) out.speakerPhone = speaker.phone;
  return out;
}

/** Convert the live contact into a Firestore update patch: set the
 *  field when present, mark it for deletion when the speaker no
 *  longer has that channel. Keeps the invitation snapshot honest so a
 *  subsequent resend doesn't fall back to a removed channel. */
function contactWritePatch(
  live: LiveContact,
): Record<string, string | FirebaseFirestore.FieldValue> {
  return {
    speakerEmail: live.speakerEmail ?? FieldValue.delete(),
    speakerPhone: live.speakerPhone ?? FieldValue.delete(),
  };
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
        input.wardId,
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
    out.push(await trySms(input.wardId, invitation.speakerPhone, emailArgs));
  }
  return out;
}
