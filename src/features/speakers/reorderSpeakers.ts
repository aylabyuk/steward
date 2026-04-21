import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { computeContentHash } from "@/features/meetings/contentHash";
import { appendHistoryEvent, currentActor } from "@/features/meetings/history";
import { buildInvalidationPatch } from "@/features/meetings/writeMeetingPatch";
import { db } from "@/lib/firebase";
import { reportSaved, reportSaveError, reportSaving } from "@/stores/saveStatusStore";
import { sacramentMeetingSchema, speakerSchema } from "@/lib/types";

function speakerRef(wardId: string, date: string, speakerId: string) {
  return doc(db, "wards", wardId, "meetings", date, "speakers", speakerId);
}

/**
 * Persist a new order for all speakers in the given date. Runs in a
 * single Firestore transaction that both rewrites each speaker's
 * `order` field AND recomputes the meeting's content hash (invalidating
 * live approvals + resetting status to draft if applicable). This keeps
 * the speaker order and the hash-driven approval invariant atomic — a
 * partial failure can't leave the order live with a stale hash.
 *
 * Note: Firestore transactions read only DocumentReferences, not
 * collection queries. We read each speaker doc individually inside the
 * transaction; for our data (≤ ~5 speakers per meeting) that's cheap.
 */
export async function reorderSpeakers(
  wardId: string,
  date: string,
  orderedIds: readonly string[],
): Promise<void> {
  reportSaving();
  try {
    await doReorder(wardId, date, orderedIds);
    reportSaved();
  } catch (e) {
    reportSaveError(e);
    throw e;
  }
}

async function doReorder(
  wardId: string,
  date: string,
  orderedIds: readonly string[],
): Promise<void> {
  const meetingRef = doc(db, "wards", wardId, "meetings", date);
  const refs = orderedIds.map((id) => speakerRef(wardId, date, id));
  const actor = currentActor();

  await runTransaction(db, async (tx) => {
    const mSnap = await tx.get(meetingRef);
    if (!mSnap.exists()) return;
    const mParsed = sacramentMeetingSchema.safeParse(mSnap.data());
    if (!mParsed.success) return;
    const meeting = mParsed.data;

    const sSnaps = await Promise.all(refs.map((r) => tx.get(r)));
    const reordered = sSnaps.map((snap, i) => {
      const parsed = speakerSchema.safeParse(snap.data());
      if (!parsed.success) throw new Error(`Speaker ${orderedIds[i]} missing or invalid`);
      return { id: orderedIds[i]!, data: { ...parsed.data, order: i } };
    });

    const newHash = await computeContentHash(meeting, reordered);
    const { patch, invalidatedCount } = buildInvalidationPatch(meeting, newHash);

    refs.forEach((ref, i) => {
      tx.update(ref, { order: i, updatedAt: serverTimestamp() });
    });
    tx.update(meetingRef, patch);

    if (actor) {
      appendHistoryEvent(tx, wardId, date, actor, {
        target: "speaker",
        targetId: "reorder",
        action: "update",
        changes: [{ field: "order", new: orderedIds.join(",") }],
      });
      if (invalidatedCount > 0) {
        appendHistoryEvent(tx, wardId, date, actor, {
          target: "approval",
          targetId: date,
          action: "update",
          changes: [{ field: "invalidated", new: invalidatedCount }],
        });
      }
    }
  });
}
