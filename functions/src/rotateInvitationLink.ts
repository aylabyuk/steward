import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { authInvitationPath, txGetMerged } from "./invitationDocs.js";
import { revokeSpeakerSession } from "./issueSpeakerSession.helpers.js";
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
  const plaintextToken = generateInvitationToken();
  const tokenHash = hashInvitationToken(plaintextToken);

  // Single transaction: read invitation, validate not expired, refresh
  // contact snapshot from the live speaker doc, revoke any prior
  // speaker session, and commit the rotation. revokeRefreshTokens is
  // idempotent so a tx retry is safe. Putting the revoke inside the
  // tx boundary closes the window where the new token was committed
  // but the old session was still alive.
  const { invitation, effectiveContact } = await db.runTransaction(async (tx) => {
    const { authRef, data } = await txGetMerged(db, tx, input.wardId, input.invitationId);
    if (!data) throw new HttpsError("not-found", "Invitation not found.");
    const expiresAtMillis = data.expiresAt?.toMillis();
    if (typeof expiresAtMillis === "number" && expiresAtMillis < Date.now()) {
      throw new HttpsError(
        "failed-precondition",
        "Invitation has expired — start a fresh one instead.",
      );
    }

    // Refresh the speakerEmail + speakerPhone snapshot from the live
    // speaker doc before we build the delivery payload. Without this,
    // a bishop correcting a typo in the speaker's phone number and then
    // hitting Resend would still deliver to the stale number on the
    // invitation doc. The rest of the letter (name, date, wardName,
    // inviterName) stays frozen — only delivery channels refresh. Read
    // is `tx.get` so the live contact lock-step matches the rotation.
    const liveContact =
      input.channels.length > 0 ? await readLiveContactInfo(db, tx, input.wardId, data) : null;
    const writePatch = liveContact ? contactWritePatch(liveContact) : {};
    const effective: Pick<SpeakerInvitationShape, "speakerEmail" | "speakerPhone"> =
      liveContact ?? {
        ...(data.speakerEmail ? { speakerEmail: data.speakerEmail } : {}),
        ...(data.speakerPhone ? { speakerPhone: data.speakerPhone } : {}),
      };

    // L2: revoke before tx.update so the prior session can't outlive
    // the rotation commit. Same rationale as decideTokenAction's
    // rotate branch — see issueSpeakerSession.helpers.ts.
    // Distinct from rotateTokenForBishopNotification, which
    // intentionally doesn't revoke (the speaker may be actively in
    // chat there).
    await revokeSpeakerSession(input.wardId, input.invitationId);

    // C1 doc-split: token state + speaker contact PII are on the auth
    // subdoc now; this whole rotation patch goes to that doc.
    tx.update(authRef, {
      tokenHash,
      tokenStatus: "active" as const,
      ...writePatch,
    });

    return { invitation: data, effectiveContact: effective };
  });

  const inviteUrl = buildInviteUrl(origin, input.wardId, input.invitationId, plaintextToken);
  const freshInvitation: SpeakerInvitationShape = { ...invitation, ...effectiveContact };
  const deliveryRecord = await deliverIfRequested(input, freshInvitation, inviteUrl);
  if (deliveryRecord.length > 0) {
    await db.doc(authInvitationPath(input.wardId, input.invitationId)).update({
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
  tx: FirebaseFirestore.Transaction,
  wardId: string,
  invitation: SpeakerInvitationShape,
): Promise<LiveContact | null> {
  const { meetingDate, speakerId } = invitation.speakerRef;
  const speakerRef = db.doc(`wards/${wardId}/meetings/${meetingDate}/speakers/${speakerId}`);
  const snap = await tx.get(speakerRef);
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
