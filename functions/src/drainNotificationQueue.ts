import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { logger } from "firebase-functions/v2";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { sendAndPrune } from "./fcm.js";
import { filterRecipients, type RecipientCandidate } from "./recipients.js";
import { timezoneFor } from "./meetingChange.js";
import type { FcmToken, MemberDoc, WardDoc } from "./types.js";

interface QueueEntry {
  wardId: string;
  date: string;
  description: string;
  excludeUids?: string[];
  dispatchAt?: Timestamp;
}

/**
 * Polls the per-ward notification queue once a minute and drains entries
 * whose dispatchAt is in the past. Sends one FCM multicast per ward+date,
 * then deletes the queue doc. Idempotent against retries because the queue
 * doc is removed before we return.
 */
export const drainNotificationQueue = onSchedule("every 1 minutes", async () => {
  const db = getFirestore();
  const now = Timestamp.now();
  const due = await db.collectionGroup("notificationQueue").where("dispatchAt", "<=", now).get();
  if (due.empty) return;

  await Promise.all(
    due.docs.map(async (queueSnap) => {
      const entry = queueSnap.data() as QueueEntry;
      try {
        await dispatchOne(db, entry);
        await queueSnap.ref.delete();
      } catch (err) {
        logger.error("failed to drain notification", {
          path: queueSnap.ref.path,
          err: (err as Error).message,
        });
      }
    }),
  );
});

async function dispatchOne(db: FirebaseFirestore.Firestore, entry: QueueEntry): Promise<void> {
  const wardSnap = await db.doc(`wards/${entry.wardId}`).get();
  const ward = wardSnap.data() as WardDoc | undefined;
  const timezone = timezoneFor(ward);

  const memberSnaps = await db.collection(`wards/${entry.wardId}/members`).get();
  const exclude = entry.excludeUids ? new Set(entry.excludeUids) : new Set<string>();
  const candidates: RecipientCandidate[] = memberSnaps.docs
    .filter((m) => !exclude.has(m.id))
    .map((m) => ({ uid: m.id, member: m.data() as MemberDoc }));

  const recipients = filterRecipients(candidates, { now: new Date(), timezone });
  if (recipients.length === 0) return;

  const tokensByUid = new Map<string, readonly FcmToken[]>();
  for (const r of recipients) {
    tokensByUid.set(r.uid, r.member.fcmTokens ?? []);
  }

  const outcome = await sendAndPrune(entry.wardId, tokensByUid, {
    notification: {
      title: `Sacrament program — ${entry.date}`,
      body: entry.description,
    },
    data: { wardId: entry.wardId, date: entry.date, kind: "meeting-change" },
  });
  logger.info("dispatched meeting-change notification", {
    wardId: entry.wardId,
    date: entry.date,
    recipients: recipients.length,
    ...outcome,
  });
}
