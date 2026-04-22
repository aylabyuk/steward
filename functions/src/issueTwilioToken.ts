import { getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall, type CallableRequest } from "firebase-functions/v2/https";
import { TWILIO_SECRETS } from "./secrets.js";
import { issueChatToken } from "./twilio/token.js";
import type { MemberDoc } from "./types.js";

interface Request {
  wardId: string;
  /** Invitation token the speaker is trying to talk into. Speakers
   *  must supply this; bishops may supply it for informational
   *  logging but it doesn't affect scope (their JWT covers all
   *  conversations in the service). */
  invitationToken?: string;
}

interface Response {
  jwt: string;
  identity: string;
  expiresInSeconds: number;
}

/** Mints a Twilio Conversations JWT for the caller.
 *
 *  Two paths:
 *  - **Bishopric** — caller is an active ward member. Identity
 *    becomes `uid:{firebaseUid}`; the grant is service-wide so they
 *    can open any conversation they're a participant of.
 *  - **Speaker** — caller's verified Google email matches the
 *    invitation's `speakerEmail` snapshot. Identity is
 *    `speaker:{token}` (ephemeral per-invitation, not their uid, so
 *    Twilio's history doesn't accumulate a long-lived personal
 *    identity). Scoped to just that one conversation via
 *    participant membership (added at send time).
 *
 *  `failed-precondition` on missing speakerEmail (no phone/email on
 *  file), `deadline-exceeded` post-expiry, `permission-denied` on
 *  mismatch. The client uses the error code to pick the recovery UI. */
export const issueTwilioToken = onCall(
  { secrets: TWILIO_SECRETS },
  async (request: CallableRequest<Request>): Promise<Response> => {
    const auth = request.auth;
    if (!auth) throw new HttpsError("unauthenticated", "Sign-in required.");

    const { wardId, invitationToken } = request.data;
    if (!wardId) throw new HttpsError("invalid-argument", "wardId required.");

    const bishopric = await isActiveMember(wardId, auth.uid);
    if (bishopric) {
      const jwt = issueChatToken({ identity: `uid:${auth.uid}`, ttlSeconds: 3600 });
      return { jwt, identity: `uid:${auth.uid}`, expiresInSeconds: 3600 };
    }

    // Speaker path — email match on the invitation snapshot.
    if (!invitationToken) throw new HttpsError("invalid-argument", "invitationToken required.");
    const email = auth.token.email?.toLowerCase();
    if (!email || auth.token.email_verified !== true) {
      throw new HttpsError("permission-denied", "Verified Google email required.");
    }

    const snap = await getFirestore()
      .doc(`wards/${wardId}/speakerInvitations/${invitationToken}`)
      .get();
    if (!snap.exists) throw new HttpsError("not-found", "Invitation not found.");
    const invitation = snap.data() as {
      speakerEmail?: string;
      expiresAt?: FirebaseFirestore.Timestamp;
    };

    if (!invitation.speakerEmail) {
      throw new HttpsError("failed-precondition", "This invitation has no email on file.");
    }
    if (invitation.speakerEmail.toLowerCase() !== email) {
      throw new HttpsError(
        "permission-denied",
        `This invitation is addressed to ${maskEmail(invitation.speakerEmail)}.`,
      );
    }
    if (invitation.expiresAt && invitation.expiresAt.toMillis() <= Date.now()) {
      throw new HttpsError("deadline-exceeded", "This invitation has expired.");
    }

    const identity = `speaker:${invitationToken}`;
    const jwt = issueChatToken({ identity, ttlSeconds: 3600 });
    return { jwt, identity, expiresInSeconds: 3600 };
  },
);

async function isActiveMember(wardId: string, uid: string): Promise<boolean> {
  const snap = await getFirestore().doc(`wards/${wardId}/members/${uid}`).get();
  if (!snap.exists) return false;
  return (snap.data() as MemberDoc).active === true;
}

function maskPart(s: string): string {
  return s.length <= 2 ? s : `${s[0]}${"*".repeat(s.length - 2)}${s.at(-1)}`;
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  return `${maskPart(local)}@${maskPart(domain)}`;
}
