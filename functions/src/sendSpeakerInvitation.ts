import { HttpsError, onCall, type CallableRequest } from "firebase-functions/v2/https";
import { STEWARD_ORIGIN, TWILIO_SECRETS } from "./secrets.js";
import { assertActiveMember } from "./sendSpeakerInvitation.helpers.js";
import { createFreshInvitation } from "./freshInvitation.js";
import { rotateInvitationLink } from "./rotateInvitationLink.js";
import { resolveCallerFromNumberMode } from "./devModeAccess.js";
import type {
  SendSpeakerInvitationRequest,
  SendSpeakerInvitationResponse,
} from "./sendSpeakerInvitation.types.js";

/** Dispatches between two modes:
 *
 *  - `mode: 'fresh'` (default): creates a new invitation doc + Twilio
 *    conversation and delivers the letter via chosen channels.
 *  - `mode: 'rotate'`: generates a fresh capability token on an
 *    existing invitation — same conversationSid, chat history, and
 *    response preserved — and optionally re-delivers via email/SMS.
 *    With `channels: []` the caller gets the URL to copy manually.
 *
 *  SendGrid secrets are intentionally omitted — SMS-only delivery is
 *  the v1 contract. sendEmail() throws on the missing key; the
 *  surrounding try/catch records the failure and other channels
 *  continue unaffected. */
export const sendSpeakerInvitation = onCall(
  { secrets: TWILIO_SECRETS },
  async (
    request: CallableRequest<SendSpeakerInvitationRequest>,
  ): Promise<SendSpeakerInvitationResponse> => {
    const input = request.data;
    const auth = request.auth;
    if (!auth) throw new HttpsError("unauthenticated", "Sign-in required.");
    await assertActiveMember(input.wardId, auth.uid);

    const origin = process.env.STEWARD_ORIGIN ?? STEWARD_ORIGIN.value();
    if (input.mode === "rotate") {
      return rotateInvitationLink(input, origin);
    }
    const fromNumberMode = resolveCallerFromNumberMode(auth, input.useTestingNumber);
    return createFreshInvitation(input, origin, fromNumberMode);
  },
);
