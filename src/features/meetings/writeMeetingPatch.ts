import {
  collection,
  doc,
  getDocs,
  runTransaction,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import type { WithId } from "@/hooks/_sub";
import { db } from "@/lib/firebase";
import {
  sacramentMeetingSchema,
  type SacramentMeeting,
  speakerSchema,
  type Speaker,
} from "@/lib/types";
import { computeContentHash } from "./contentHash";
import { appendHistoryEvent, computeDiff, currentActor } from "./history";

/**
 * Given the current meeting doc and a freshly-computed content hash,
 * build the update payload that commits the new hash and, if the hash
 * has changed AND live approvals exist, invalidates them + flips status
 * back to draft. Returns the payload plus a count of newly invalidated
 * approvals so the caller can emit an audit-history event.
 *
 * Pure (does not read or write Firestore) so it can be composed into a
 * transaction alongside other mutations (see reorderSpeakers).
 */
export function buildInvalidationPatch(
  meeting: SacramentMeeting,
  newHash: string,
): { patch: Record<string, unknown>; invalidatedCount: number } {
  const patch: Record<string, unknown> = {
    contentVersionHash: newHash,
    updatedAt: serverTimestamp(),
  };
  const approvals = meeting.approvals ?? [];
  const hashChanged = newHash !== meeting.contentVersionHash;
  const hadLiveApprovals = approvals.some((a) => !a.invalidated);

  let invalidatedCount = 0;
  if (hashChanged && hadLiveApprovals) {
    const invalidatedAt = Timestamp.now();
    patch.approvals = approvals.map((a) => {
      if (a.invalidated) return a;
      invalidatedCount++;
      return { ...a, invalidated: true, invalidatedAt };
    });
    if (meeting.status !== "draft") patch.status = "draft";
  }
  return { patch, invalidatedCount };
}

/**
 * Applies `patch` to the meeting doc, recomputes contentVersionHash from the
 * (post-patch) content + current speakers, and -- if the hash changed and the
 * meeting has live approvals -- marks those approvals invalidated and flips
 * status back to draft (per the "everything is always editable" invariant).
 *
 * History: emits a meeting/update event for any patched fields and an
 * approval/update event when invalidations occur. Both ride along in the
 * same transaction as the content change.
 *
 * Firestore transactions can only read DocumentReferences, so the speakers
 * subcollection is read *before* the transaction. That leaves a narrow
 * window where a concurrent speaker add/remove would produce a slightly
 * stale hash; any such write goes through its own writeMeetingPatch and
 * will recompute the hash against the latest state.
 */
export async function writeMeetingPatch(
  wardId: string,
  date: string,
  patch: Partial<SacramentMeeting>,
): Promise<void> {
  const speakers = await readSpeakers(wardId, date);
  const ref = doc(db, "wards", wardId, "meetings", date);
  const actor = currentActor();

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const parsed = sacramentMeetingSchema.safeParse(snap.data());
    if (!parsed.success) return;
    const meeting = parsed.data;

    const newMeeting = { ...meeting, ...patch };
    const newHash = await computeContentHash(newMeeting, speakers);
    const { patch: invalPatch, invalidatedCount } = buildInvalidationPatch(meeting, newHash);

    tx.update(ref, { ...patch, ...invalPatch });

    if (actor) {
      const fieldChanges = computeDiff(
        meeting as unknown as Record<string, unknown>,
        patch as Record<string, unknown>,
        { include: Object.keys(patch) },
      );
      if (fieldChanges.length > 0) {
        appendHistoryEvent(tx, wardId, date, actor, {
          target: "meeting",
          targetId: date,
          action: "update",
          changes: fieldChanges,
        });
      }
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

async function readSpeakers(wardId: string, date: string): Promise<WithId<Speaker>[]> {
  const snap = await getDocs(collection(db, "wards", wardId, "meetings", date, "speakers"));
  const speakers: WithId<Speaker>[] = [];
  for (const d of snap.docs) {
    const parsed = speakerSchema.safeParse(d.data());
    if (parsed.success) speakers.push({ id: d.id, data: parsed.data });
  }
  return speakers;
}
