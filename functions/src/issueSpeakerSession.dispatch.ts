import { getAuth } from "firebase-admin/auth";
import { logger } from "firebase-functions/v2";
import { decideTokenAction, speakerUid } from "./issueSpeakerSession.helpers.js";
import { TOKEN_TTL_SECONDS, type SpeakerResponse } from "./issueSpeakerSession.types.js";
import { phoneLast4 } from "./invitationToken.js";
import { STEWARD_ORIGIN } from "./secrets.js";
import { buildInviteUrl, sendInvitationSms } from "./sendSpeakerInvitation.helpers.js";
import { issueChatToken } from "./twilio/token.js";

/** Speaker capability-token exchange: dispatches on `decideTokenAction`
 *  and either mints a session, returns a rate-limited / invalid status,
 *  or fires the rotation SMS and returns `rotated`. Lives in its own
 *  file so the callable entry point stays under the 150-line cap
 *  without forcing the token-decision helpers over it. */
export async function handleSpeakerTokenExchange(
  wardId: string,
  invitationId: string,
  presentedToken: string,
): Promise<SpeakerResponse> {
  const decision = await decideTokenAction(wardId, invitationId, presentedToken);
  if (decision.kind === "invalid") return { status: "invalid" };
  if (decision.kind === "rate-limited") return { status: "rate-limited" };
  if (decision.kind === "consume") {
    return mintSpeakerSession(wardId, invitationId);
  }

  // L2: session revoke now lives inside `decideTokenAction`'s rotate
  // branch, so by the time we reach this code path the prior speaker
  // session is already invalidated. Keeping the call here would just
  // be a redundant network round-trip.
  if (decision.speakerPhone) {
    try {
      const origin = process.env.STEWARD_ORIGIN ?? STEWARD_ORIGIN.value();
      await sendInvitationSms({
        wardId,
        speakerPhone: decision.speakerPhone,
        inviterName: decision.inviterName,
        wardName: decision.wardName,
        assignedDate: decision.assignedDate,
        speakerName: decision.speakerName,
        inviteUrl: buildInviteUrl(origin, wardId, invitationId, decision.newToken),
        ...(decision.speakerTopic ? { topic: decision.speakerTopic } : {}),
        ...(decision.fromNumberMode ? { fromMode: decision.fromNumberMode } : {}),
      });
    } catch (err) {
      logger.error("rotation SMS send failed", {
        wardId,
        invitationId,
        err: (err as Error).message,
      });
    }
  } else {
    logger.warn("rotation with no speakerPhone — client shows contact-bishopric fallback", {
      wardId,
      invitationId,
    });
  }
  return { status: "rotated", phoneLast4: phoneLast4(decision.speakerPhone) };
}

async function mintSpeakerSession(
  wardId: string,
  invitationId: string,
): Promise<SpeakerResponse> {
  const uid = speakerUid(wardId, invitationId);
  const identity = `speaker:${invitationId}`;
  const customToken = await getAuth().createCustomToken(uid, {
    invitationId,
    wardId,
    role: "speaker",
  });
  const twilioToken = issueChatToken({ identity, ttlSeconds: TOKEN_TTL_SECONDS });
  return {
    status: "ready",
    firebaseCustomToken: customToken,
    twilioToken,
    identity,
    expiresInSeconds: TOKEN_TTL_SECONDS,
  };
}
