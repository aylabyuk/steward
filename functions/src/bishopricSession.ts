import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { logger } from "firebase-functions/v2";
import { ensureChatParticipant } from "./twilio/conversations.js";
import { issueChatToken } from "./twilio/token.js";
import type { SpeakerInvitationShape } from "./invitationTypes.js";
import type { MemberDoc } from "./types.js";

export interface BishopricSessionResponse {
  status: "ready";
  twilioToken: string;
  identity: string;
  expiresInSeconds: number;
  /** Set only when the caller asked for `mintWebSession: true`. Signs
   *  the bishop into a fresh web Firebase Auth context — used by the
   *  iOS WebView embed, which can't share Keychain-backed iOS auth
   *  with the WebView's IndexedDB store. */
  firebaseCustomToken?: string;
}

interface MintBishopricSessionArgs {
  wardId: string;
  uid: string;
  member: MemberDoc;
  invitationId: string | undefined;
  ttlSeconds: number;
  /** When true, also mint a Firebase custom token (same UID) so a
   *  WebView can `signInWithCustomToken` and inherit the bishop's own
   *  Firestore-rule access. Off by default to avoid extra Auth admin
   *  calls on every routine bishopric refresh. */
  mintWebSession?: boolean;
}

/** Mints a Twilio chat token for a bishopric/clerk caller. If
 *  `invitationId` is provided, also idempotently adds them to that
 *  invitation's Twilio conversation — handles the case where a member
 *  was added or activated after sendSpeakerInvitation snapshot the
 *  roster and would otherwise be unable to `getConversationBySid`. */
export async function mintBishopricSession({
  wardId,
  uid,
  member,
  invitationId,
  ttlSeconds,
  mintWebSession,
}: MintBishopricSessionArgs): Promise<BishopricSessionResponse> {
  const identity = `uid:${uid}`;
  const twilioToken = issueChatToken({ identity, ttlSeconds });
  if (invitationId) {
    await backfillBishopricParticipant(wardId, invitationId, identity, member);
  }
  const base: BishopricSessionResponse = {
    status: "ready",
    twilioToken,
    identity,
    expiresInSeconds: ttlSeconds,
  };
  if (mintWebSession) {
    const firebaseCustomToken = await getAuth().createCustomToken(uid, { embed: "ios" });
    return { ...base, firebaseCustomToken };
  }
  return base;
}

/** Idempotently adds the bishopric caller to the invitation's Twilio
 *  conversation. Failures are logged and swallowed so a Twilio outage
 *  doesn't block token mint. */
async function backfillBishopricParticipant(
  wardId: string,
  invitationId: string,
  identity: string,
  member: MemberDoc,
): Promise<void> {
  try {
    const snap = await getFirestore()
      .doc(`wards/${wardId}/speakerInvitations/${invitationId}`)
      .get();
    if (!snap.exists) return;
    const data = snap.data() as SpeakerInvitationShape;
    if (!data.conversationSid) return;
    await ensureChatParticipant(data.conversationSid, identity, {
      displayName: member.displayName,
      role: member.role,
      email: member.email,
    });
  } catch (err) {
    logger.warn("bishopric participant backfill failed", {
      wardId,
      invitationId,
      identity,
      err: (err as Error).message,
    });
  }
}

export async function loadActiveMember(wardId: string, uid: string): Promise<MemberDoc | null> {
  const snap = await getFirestore().doc(`wards/${wardId}/members/${uid}`).get();
  if (!snap.exists) return null;
  const data = snap.data() as MemberDoc;
  return data.active === true ? data : null;
}
