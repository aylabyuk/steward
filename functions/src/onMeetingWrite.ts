import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { logger } from "firebase-functions/v2";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import {
  classifyMeetingChange,
  describeChange,
  type MeetingChangeKind,
  type MeetingDocLite,
} from "./meetingChange.js";

const DEBOUNCE_SECONDS = 60;

interface QueueDoc {
  wardId: string;
  date: string;
  kind: MeetingChangeKind;
  description: string;
  excludeUids: string[];
  dispatchAt: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export const onMeetingWrite = onDocumentWritten("wards/{wardId}/meetings/{date}", async (event) => {
  const before = event.data?.before.data() as MeetingDocLite | undefined;
  const after = event.data?.after.data() as MeetingDocLite | undefined;
  const kind = classifyMeetingChange(before, after);
  if (!kind || !after) return;

  const { wardId, date } = event.params;
  const db = getFirestore();
  const actorUid = await readLatestActor(db, wardId, date);
  const description = describeChange(kind, after);
  const now = Timestamp.now();
  const dispatchAt = Timestamp.fromMillis(now.toMillis() + DEBOUNCE_SECONDS * 1000);
  const queueRef = db.doc(`wards/${wardId}/notificationQueue/${date}`);

  await db.runTransaction(async (tx) => {
    const existing = await tx.get(queueRef);
    const excludeUids = new Set<string>(existing.exists ? (existing.get("excludeUids") ?? []) : []);
    if (actorUid) excludeUids.add(actorUid);
    const next: Partial<QueueDoc> = {
      wardId,
      date,
      kind,
      description,
      excludeUids: [...excludeUids],
      dispatchAt,
      updatedAt: now,
    };
    if (existing.exists) {
      tx.update(queueRef, next);
    } else {
      tx.set(queueRef, { ...next, createdAt: now });
    }
  });

  logger.info("queued meeting-change notification", {
    wardId,
    date,
    kind,
    actorUid,
    dispatchAt: dispatchAt.toDate().toISOString(),
  });
});

async function readLatestActor(
  db: FirebaseFirestore.Firestore,
  wardId: string,
  date: string,
): Promise<string | undefined> {
  const snap = await db
    .collection(`wards/${wardId}/meetings/${date}/history`)
    .orderBy("at", "desc")
    .limit(1)
    .get();
  if (snap.empty) return undefined;
  return snap.docs[0]?.get("actorUid") as string | undefined;
}
