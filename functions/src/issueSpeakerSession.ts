import { HttpsError, onCall, type CallableRequest } from "firebase-functions/v2/https";
import { TWILIO_SECRETS } from "./secrets.js";
import { issueChatToken } from "./twilio/token.js";
import { handleSpeakerTokenExchange } from "./issueSpeakerSession.dispatch.js";
import { callerIp, logRateLimited, rateLimitOk } from "./rateLimit.js";
import {
  loadActiveMember,
  mintBishopricSession,
  type BishopricSessionResponse,
} from "./bishopricSession.js";
import { TOKEN_TTL_SECONDS, type SpeakerResponse } from "./issueSpeakerSession.types.js";

interface Request {
  wardId: string;
  invitationId?: string;
  invitationToken?: string;
  /** Bishopric-only opt-in. When true, the bishopric branch returns
   *  an extra `firebaseCustomToken` so an iOS WebView embed can sign
   *  the bishop into the web Firebase Auth context. Ignored on the
   *  speaker token-exchange path. */
  mintWebSession?: boolean;
}

type Response = SpeakerResponse | BishopricSessionResponse;

/** Per-IP rate limit on the speaker token-exchange surface. Combined
 *  with App Check (which blocks non-app callers entirely) this is a
 *  best-effort backstop — picked to comfortably accommodate a real
 *  speaker iterating through retries (refresh, re-tap link) while
 *  cutting off scripted bursts. */
const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MS = 60_000;

/** Server-side App Check enforcement is gated by env so the operator
 *  can ship the client-side init first, observe metrics for missing /
 *  failing tokens, and then flip the flag once real traffic looks
 *  healthy. Set `APP_CHECK_ENFORCED=true` on the function to enable. */
const enforceAppCheck = process.env.APP_CHECK_ENFORCED === "true";

/** Exchanges an invitation capability token for a Firebase custom
 *  token + Twilio Conversations JWT. Replaces the prior OTP-based
 *  speaker sign-in: the invitation SMS is already the identity
 *  signal, so possession of the URL token proves identity directly.
 *  Full decision tree lives in `issueSpeakerSession.helpers.ts`. */
export const issueSpeakerSession = onCall(
  { secrets: TWILIO_SECRETS, enforceAppCheck },
  async (request: CallableRequest<Request>): Promise<Response> => {
    const ip = callerIp(request.rawRequest);
    if (
      !rateLimitOk({
        bucketKey: `issueSpeakerSession:${ip}`,
        max: RATE_LIMIT_MAX,
        windowMs: RATE_LIMIT_WINDOW_MS,
      })
    ) {
      logRateLimited("issueSpeakerSession", ip);
      // Reuse the existing speaker-shape "rate-limited" status so the
      // landing page renders its existing rate-limit UI without a
      // separate error branch.
      return { status: "rate-limited" } as SpeakerResponse;
    }

    const { wardId, invitationId, invitationToken, mintWebSession } = request.data;
    if (!wardId) throw new HttpsError("invalid-argument", "wardId required.");
    const auth = request.auth;

    if (auth) {
      const member = await loadActiveMember(wardId, auth.uid);
      if (member) {
        return mintBishopricSession({
          wardId,
          uid: auth.uid,
          member,
          invitationId,
          ttlSeconds: TOKEN_TTL_SECONDS,
          ...(mintWebSession ? { mintWebSession: true } : {}),
        });
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
