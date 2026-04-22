import { getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall, type CallableRequest } from "firebase-functions/v2/https";
import { TWILIO_SECRETS } from "./secrets.js";
import { issueChatToken } from "./twilio/token.js";
import type { MemberDoc } from "./types.js";

interface Request {
  wardId: string;
  /** Required on the speaker path (scopes the JWT identity to this
   *  invitation). Bishopric callers may omit it. */
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
 *    `uid:{firebaseUid}`; service-wide grant so they can see every
 *    conversation they're a participant of.
 *  - **Speaker** — any signed-in caller with a verified Google
 *    account + a valid invitationToken. Identity `speaker:{token}`
 *    (ephemeral per-invitation, not their uid). The token itself
 *    is the authorization; no email-match against the invitation
 *    is required. Pre-expiry only.
 *
 *  Errors:
 *  - `unauthenticated` / `permission-denied` on unverified email
 *  - `invalid-argument` on missing wardId / invitationToken
 *  - `not-found` when the invitation doesn't exist
 *  - `deadline-exceeded` post-expiry
 *  The client uses the error code to pick the recovery UI. */
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

    // Speaker path — verified Google account + a valid, unexpired
    // invitation token is enough. The URL-bearer is treated as the
    // speaker; actor identity is recorded on any write they make.
    if (!invitationToken) throw new HttpsError("invalid-argument", "invitationToken required.");
    if (auth.token.email_verified !== true) {
      throw new HttpsError("permission-denied", "Verified Google email required.");
    }

    const snap = await getFirestore()
      .doc(`wards/${wardId}/speakerInvitations/${invitationToken}`)
      .get();
    if (!snap.exists) throw new HttpsError("not-found", "Invitation not found.");
    const invitation = snap.data() as { expiresAt?: FirebaseFirestore.Timestamp };
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
