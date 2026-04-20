import { getFirestore } from "firebase-admin/firestore";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { logger } from "firebase-functions/v2";
import { sendAndPrune } from "./fcm.js";
import { filterRecipients, type RecipientCandidate } from "./recipients.js";
import type { CommentDoc, FcmToken, MemberDoc, WardDoc } from "./types.js";

export const onCommentCreate = onDocumentCreated(
  "wards/{wardId}/meetings/{date}/comments/{commentId}",
  async (event) => {
    const snap = event.data;
    if (!snap) return;
    const { wardId, date } = event.params;
    const comment = snap.data() as CommentDoc;
    const mentions = comment.mentionedUids ?? [];
    if (mentions.length === 0) return;

    const db = getFirestore();
    const wardSnap = await db.doc(`wards/${wardId}`).get();
    const ward = wardSnap.data() as WardDoc | undefined;
    const timezone = ward?.settings?.timezone ?? "UTC";

    const memberSnaps = await Promise.all(
      mentions.map((uid) => db.doc(`wards/${wardId}/members/${uid}`).get()),
    );
    const candidates: RecipientCandidate[] = [];
    for (const ms of memberSnaps) {
      if (!ms.exists) continue;
      candidates.push({ uid: ms.id, member: ms.data() as MemberDoc });
    }

    const recipients = filterRecipients(candidates, {
      now: new Date(),
      timezone,
      excludeUid: comment.authorUid,
    });
    if (recipients.length === 0) return;

    const tokensByUid = new Map<string, readonly FcmToken[]>();
    for (const r of recipients) {
      tokensByUid.set(r.uid, r.member.fcmTokens ?? []);
    }

    const outcome = await sendAndPrune(wardId, tokensByUid, {
      notification: {
        title: `${comment.authorDisplayName} mentioned you`,
        body: `On Sunday ${date}: ${truncate(comment.body, 120)}`,
      },
      data: { wardId, date, kind: "mention" },
    });

    logger.info("comment-mention notification sent", {
      wardId,
      date,
      mentions: mentions.length,
      recipients: recipients.length,
      ...outcome,
    });
  },
);

function truncate(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}
