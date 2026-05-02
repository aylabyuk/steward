import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore, Timestamp } from "firebase-admin/firestore";
import { logger } from "firebase-functions/v2";
import { txGetMerged } from "./invitationDocs.js";
import {
  generateInvitationToken,
  hashInvitationToken,
  rotationBucketKey,
  ROTATION_DAILY_CAP,
  tokenHashMatches,
} from "./invitationToken.js";
import type { SpeakerInvitationShape } from "./invitationTypes.js";

export type TokenDecision =
  | { kind: "consume" }
  | {
      kind: "rotate";
      newToken: string;
      speakerPhone: string | undefined;
      speakerName: string;
      speakerTopic: string | undefined;
      inviterName: string;
      wardName: string;
      assignedDate: string;
      fromNumberMode: SpeakerInvitationShape["fromNumberMode"];
    }
  | { kind: "rate-limited" }
  | { kind: "invalid" };

/** Atomically resolves what to do with a presented capability token.
 *  Hash-matches, branches on status/expiry, and either flips status
 *  to `"consumed"` or rotates the hash + bumps the daily counter —
 *  all in one transaction so concurrent exchanges can't both win. */
export async function decideTokenAction(
  wardId: string,
  invitationId: string,
  presentedToken: string,
): Promise<TokenDecision> {
  const db = getFirestore();
  return db.runTransaction(async (tx): Promise<TokenDecision> => {
    // C1 doc-split: token state lives on the auth subdoc; the public
    // letter fields stay on the parent. txGetMerged loads both inside
    // the transaction and returns the merged shape so the rest of the
    // logic doesn't need to know about the split.
    const { authRef, data } = await txGetMerged(db, tx, wardId, invitationId);
    if (!data) return { kind: "invalid" };
    if (!data.tokenHash) return { kind: "invalid" };
    if (!tokenHashMatches(presentedToken, data.tokenHash)) {
      return { kind: "invalid" };
    }

    const now = new Date();
    const expired =
      data.tokenExpiresAt instanceof Timestamp && data.tokenExpiresAt.toMillis() <= now.getTime();

    if (data.tokenStatus === "active" && !expired) {
      tx.update(authRef, { tokenStatus: "consumed" });
      return { kind: "consume" };
    }

    const bucket = rotationBucketKey(now);
    const counts = data.tokenRotationsByDay ?? {};
    const todayCount = counts[bucket] ?? 0;
    if (todayCount >= ROTATION_DAILY_CAP) {
      return { kind: "rate-limited" };
    }

    const newToken = generateInvitationToken();
    const newHash = hashInvitationToken(newToken);
    // Revoke the prior speaker session inside the same transaction
    // boundary as the rotation write. revokeRefreshTokens is idempotent,
    // so a tx retry running it twice is harmless. Keeping the call here
    // (rather than after `runTransaction` returns) closes the window
    // where the new token was committed but the old session was still
    // alive — a leaked link can't keep its session past a rotation.
    await revokeSpeakerSession(wardId, invitationId);
    tx.update(authRef, {
      tokenHash: newHash,
      tokenStatus: "active",
      [`tokenRotationsByDay.${bucket}`]: FieldValue.increment(1),
    });
    return {
      kind: "rotate",
      newToken,
      speakerPhone: data.speakerPhone,
      speakerName: data.speakerName,
      speakerTopic: data.speakerTopic,
      inviterName: data.inviterName,
      wardName: data.wardName,
      assignedDate: data.assignedDate,
      fromNumberMode: data.fromNumberMode,
    };
  });
}

/** Mint a fresh capability token for the bishop-reply notification
 *  SMS. Unlike `decideTokenAction`'s rotate branch, this path is
 *  bishop-initiated (not visitor-triggered): it does NOT count against
 *  `tokenRotationsByDay`, does NOT revoke the speaker's Firebase
 *  session (they may be actively in chat), and keeps the invitation's
 *  original `tokenExpiresAt`. If the invitation is missing or past
 *  expiry, returns null so the caller can skip the SMS.
 *
 *  Side effect: overwrites `tokenHash` on the invitation doc. The
 *  speaker's original SMS URL (if still unused) becomes invalid —
 *  that's acceptable because the fresh notification SMS carries a
 *  working URL to the same conversation. */
export async function rotateTokenForBishopNotification(
  wardId: string,
  invitationId: string,
): Promise<{ newToken: string; speakerPhone: string | undefined } | null> {
  const db = getFirestore();
  return db.runTransaction(async (tx) => {
    const { authRef, data } = await txGetMerged(db, tx, wardId, invitationId);
    if (!data) return null;
    const now = Date.now();
    if (data.tokenExpiresAt instanceof Timestamp && data.tokenExpiresAt.toMillis() <= now) {
      return null;
    }
    const newToken = generateInvitationToken();
    const newHash = hashInvitationToken(newToken);
    tx.update(authRef, { tokenHash: newHash, tokenStatus: "active" as const });
    return { newToken, speakerPhone: data.speakerPhone };
  });
}

/** Tears down any Firebase Auth session previously minted for this
 *  invitation. Used on rotation so a leaked link that got signed in
 *  can't keep its session alive past the next ID-token refresh. */
export async function revokeSpeakerSession(wardId: string, invitationId: string): Promise<void> {
  const uid = speakerUid(wardId, invitationId);
  try {
    await getAuth().revokeRefreshTokens(uid);
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code !== "auth/user-not-found") {
      logger.warn("revokeRefreshTokens failed", {
        wardId,
        invitationId,
        err: (err as Error).message,
      });
    }
  }
}

/** Deterministic uid for the speaker of a given invitation. Stable
 *  across token rotations, so consecutive sign-ins for the same
 *  invitation reuse the same Firebase Auth user (and carry the same
 *  `actorUid` on `response` writes). */
export function speakerUid(wardId: string, invitationId: string): string {
  return `speaker:${wardId}:${invitationId}`;
}
