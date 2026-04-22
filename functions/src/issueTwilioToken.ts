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
 *  - **Bishopric** — Google-authed active ward member. Identity
 *    `uid:{firebaseUid}`; service-wide grant so they can see every
 *    conversation they're a participant of.
 *  - **Speaker** — phone-authed (Firebase Phone Auth) caller whose
 *    verified phone number matches the invitation's snapshotted
 *    `speakerPhone`. Identity `speaker:{token}` (ephemeral per-
 *    invitation). Pre-expiry only.
 *
 *  Errors the client uses to pick recovery UI:
 *  - `unauthenticated` / `permission-denied` on missing phone
 *  - `invalid-argument` on missing wardId / invitationToken
 *  - `not-found` when the invitation doesn't exist
 *  - `failed-precondition` on missing speakerPhone snapshot or
 *    phone mismatch
 *  - `deadline-exceeded` post-expiry */
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

    // Speaker path — phone auth + matching number on the invitation.
    if (!invitationToken) throw new HttpsError("invalid-argument", "invitationToken required.");
    const phone = auth.token.phone_number as string | undefined;
    if (!phone) {
      throw new HttpsError("permission-denied", "Phone verification required.");
    }

    const snap = await getFirestore()
      .doc(`wards/${wardId}/speakerInvitations/${invitationToken}`)
      .get();
    if (!snap.exists) throw new HttpsError("not-found", "Invitation not found.");
    const invitation = snap.data() as {
      speakerPhone?: string;
      expiresAt?: FirebaseFirestore.Timestamp;
    };

    if (!invitation.speakerPhone) {
      throw new HttpsError("failed-precondition", "This invitation has no phone on file.");
    }
    if (invitation.speakerPhone !== phone) {
      throw new HttpsError(
        "failed-precondition",
        "Verified phone doesn't match the invited number.",
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
