import { getFirestore } from "firebase-admin/firestore";
import { logger } from "firebase-functions/v2";
import { sendDisplayPush } from "./fcm.js";
import { filterRecipients, type RecipientCandidate } from "./recipients.js";
import type { FcmToken, MemberDoc, WardDoc } from "./types.js";
import type { ResolvedInvitation } from "./invitationReplyNotify.js";

/** A new message was posted in the conversation → FCM push to active
 *  bishopric members of the ward. Reuses the quiet-hours + token
 *  pruning helpers that the mention notifications already use.
 *
 *  When `senderBishopUid` is supplied (bishop-to-bishop path), the
 *  sender is filtered out of recipients and the push title carries
 *  their displayName. When omitted (speaker-posted path), all active
 *  bishopric members receive the push and the title reflects the
 *  speaker's invitation-recorded name.
 *
 *  The payload carries `webpush.fcmOptions.link` so a tap deep-links
 *  to the speaker's chat dialog on the Schedule page; the SW
 *  `notificationclick` handler reads the same shape for browsers that
 *  don't honor `fcmOptions.link` natively. */
export async function pushToBishopric(
  inv: ResolvedInvitation,
  body: string,
  options?: { senderBishopUid?: string },
): Promise<void> {
  const db = getFirestore();
  const senderUid = options?.senderBishopUid;
  logger.info("reply push: start", {
    wardId: inv.wardId,
    invitationId: inv.token,
    senderBishopUid: senderUid ?? null,
  });

  const wardSnap = await db.doc(`wards/${inv.wardId}`).get();
  const ward = wardSnap.data() as WardDoc | undefined;
  const timezone = ward?.settings?.timezone ?? "UTC";
  const membersSnap = await db.collection(`wards/${inv.wardId}/members`).get();
  const candidates: RecipientCandidate[] = membersSnap.docs
    .map((d) => {
      const m = d.data() as MemberDoc;
      return m.role === "bishopric" ? { uid: d.id, member: m } : null;
    })
    .filter((c): c is RecipientCandidate => c !== null);
  const senderName = senderUid
    ? (candidates.find((c) => c.uid === senderUid)?.member.displayName ?? null)
    : null;
  const recipients = filterRecipients(candidates, {
    now: new Date(),
    timezone,
    excludeUid: senderUid,
  });
  logger.info("reply push: recipients", {
    wardId: inv.wardId,
    invitationId: inv.token,
    bishopricCandidates: candidates.length,
    recipientsAfterFilter: recipients.length,
    candidateUids: candidates.map((c) => c.uid),
    excludeUid: senderUid ?? null,
  });
  if (recipients.length === 0) return;

  const tokensByUid = new Map<string, readonly FcmToken[]>();
  let totalTokens = 0;
  for (const r of recipients) {
    const tokens = r.member.fcmTokens ?? [];
    tokensByUid.set(r.uid, tokens);
    totalTokens += tokens.length;
  }
  logger.info("reply push: sending", {
    wardId: inv.wardId,
    invitationId: inv.token,
    recipientCount: recipients.length,
    totalTokens,
  });
  // Title source depends on who posted. Fallback when a bishop's
  // displayName is missing — use the ward name so the recipient still
  // gets recognizable context.
  const title = senderUid ? `${senderName ?? inv.wardName} replied` : `${inv.speakerName} replied`;
  try {
    const outcome = await sendDisplayPush(inv.wardId, tokensByUid, {
      title,
      body: truncate(body, 120),
      data: { wardId: inv.wardId, invitationId: inv.token, kind: "invitation-reply" },
    });
    logger.info("reply push: outcome", {
      wardId: inv.wardId,
      invitationId: inv.token,
      successCount: outcome.successCount,
      failureCount: outcome.failureCount,
      deadTokenCount: outcome.deadTokens.length,
    });
  } catch (err) {
    logger.error("reply push fan-out failed", {
      wardId: inv.wardId,
      invitationId: inv.token,
      err: (err as Error).message,
    });
  }
}

function truncate(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}
