import { getAuth } from "firebase-admin/auth";
import { logger } from "firebase-functions/v2";
import { HttpsError, onCall, type CallableRequest } from "firebase-functions/v2/https";
import { STEWARD_ORIGIN, TWILIO_SECRETS } from "./secrets.js";
import { issueChatToken } from "./twilio/token.js";
import { phoneLast4 } from "./invitationToken.js";
import { buildInviteUrl, sendInvitationSms } from "./sendSpeakerInvitation.helpers.js";
import {
  decideTokenAction,
  revokeSpeakerSession,
  speakerUid,
} from "./issueSpeakerSession.helpers.js";
import { getFirestore } from "firebase-admin/firestore";
import type { MemberDoc } from "./types.js";

interface Request {
  wardId: string;
  invitationId?: string;
  invitationToken?: string;
}

type SpeakerResponse =
  | {
      status: "ready";
      firebaseCustomToken: string;
      twilioToken: string;
      identity: string;
      expiresInSeconds: number;
    }
  | { status: "rotated"; phoneLast4: string | null }
  | { status: "rate-limited" }
  | { status: "invalid" };

interface BishopricResponse {
  status: "ready";
  twilioToken: string;
  identity: string;
  expiresInSeconds: number;
}

type Response = SpeakerResponse | BishopricResponse;

const TOKEN_TTL_SECONDS = 3600;

/** Exchanges an invitation capability token for a Firebase custom
 *  token + Twilio Conversations JWT. Replaces the prior OTP-based
 *  speaker sign-in: the invitation SMS is already the identity
 *  signal, so possession of the URL token proves identity directly.
 *  Full decision tree lives in `issueSpeakerSession.helpers.ts`. */
export const issueSpeakerSession = onCall(
  { secrets: TWILIO_SECRETS },
  async (request: CallableRequest<Request>): Promise<Response> => {
    const { wardId, invitationId, invitationToken } = request.data;
    if (!wardId) throw new HttpsError("invalid-argument", "wardId required.");
    const auth = request.auth;

    if (auth) {
      if (await isActiveMember(wardId, auth.uid)) {
        return mintBishopricSession(auth.uid);
      }
      if (isSpeakerOfInvitation(auth, invitationId)) {
        return mintSpeakerRefresh(invitationId!);
      }
    }

    if (!invitationId || !invitationToken) {
      throw new HttpsError(
        "invalid-argument",
        "invitationId + invitationToken required for speaker sign-in.",
      );
    }
    return handleSpeakerTokenExchange(wardId, invitationId, invitationToken);
  },
);

function isSpeakerOfInvitation(
  auth: CallableRequest["auth"],
  invitationId: string | undefined,
): boolean {
  if (!auth || !invitationId) return false;
  const claim = auth.token["invitationId"];
  return typeof claim === "string" && claim === invitationId;
}

function mintBishopricSession(uid: string): BishopricResponse {
  const identity = `uid:${uid}`;
  const twilioToken = issueChatToken({ identity, ttlSeconds: TOKEN_TTL_SECONDS });
  return { status: "ready", twilioToken, identity, expiresInSeconds: TOKEN_TTL_SECONDS };
}

function mintSpeakerRefresh(invitationId: string): SpeakerResponse {
  const identity = `speaker:${invitationId}`;
  const twilioToken = issueChatToken({ identity, ttlSeconds: TOKEN_TTL_SECONDS });
  return {
    status: "ready",
    firebaseCustomToken: "",
    twilioToken,
    identity,
    expiresInSeconds: TOKEN_TTL_SECONDS,
  };
}

async function isActiveMember(wardId: string, uid: string): Promise<boolean> {
  const snap = await getFirestore().doc(`wards/${wardId}/members/${uid}`).get();
  if (!snap.exists) return false;
  return (snap.data() as MemberDoc).active === true;
}

async function handleSpeakerTokenExchange(
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

  await revokeSpeakerSession(wardId, invitationId);
  if (decision.speakerPhone) {
    try {
      const origin = process.env.STEWARD_ORIGIN ?? STEWARD_ORIGIN.value();
      await sendInvitationSms({
        speakerPhone: decision.speakerPhone,
        inviterName: decision.inviterName,
        wardName: decision.wardName,
        assignedDate: decision.assignedDate,
        speakerName: decision.speakerName,
        inviteUrl: buildInviteUrl(origin, wardId, invitationId, decision.newToken),
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

async function mintSpeakerSession(wardId: string, invitationId: string): Promise<SpeakerResponse> {
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
