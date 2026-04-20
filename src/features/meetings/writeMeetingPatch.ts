import { doc, serverTimestamp, Timestamp, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { SacramentMeeting } from "@/lib/types";
import { computeContentHash } from "./contentHash";
import { appendHistoryEvent, computeDiff, currentActor } from "./history";
import { readMeetingAndSpeakers } from "./readMeetingAndSpeakers";

/**
 * Applies `patch` to the meeting doc, recomputes contentVersionHash from the
 * (post-patch) content + current speakers, and -- if the hash changed and the
 * meeting has live approvals -- marks those approvals invalidated and flips
 * status back to draft (per the "everything is always editable" invariant).
 *
 * History: emits a meeting/update event for any patched fields and an
 * approval/update event when invalidations occur. Both ride along in the same
 * batched write as the content change.
 */
export async function writeMeetingPatch(
  wardId: string,
  date: string,
  patch: Partial<SacramentMeeting>,
): Promise<void> {
  const current = await readMeetingAndSpeakers(wardId, date);
  if (!current) return;
  const { meeting, speakers } = current;
  const newMeeting = { ...meeting, ...patch };
  const newHash = await computeContentHash(newMeeting, speakers);

  const hashChanged = newHash !== meeting.contentVersionHash;
  const approvals = meeting.approvals ?? [];
  const hadLiveApprovals = approvals.some((a) => !a.invalidated);

  const full: Record<string, unknown> = {
    ...patch,
    contentVersionHash: newHash,
    updatedAt: serverTimestamp(),
  };

  let invalidatedCount = 0;
  if (hashChanged && hadLiveApprovals) {
    const invalidatedAt = Timestamp.now();
    full.approvals = approvals.map((a) => {
      if (a.invalidated) return a;
      invalidatedCount++;
      return { ...a, invalidated: true, invalidatedAt };
    });
    if (meeting.status !== "draft") full.status = "draft";
  }

  const batch = writeBatch(db);
  batch.update(doc(db, "wards", wardId, "meetings", date), full);

  const actor = currentActor();
  if (actor) {
    const fieldChanges = computeDiff(
      meeting as unknown as Record<string, unknown>,
      patch as Record<string, unknown>,
      { include: Object.keys(patch) },
    );
    if (fieldChanges.length > 0) {
      appendHistoryEvent(batch, wardId, date, actor, {
        target: "meeting",
        targetId: date,
        action: "update",
        changes: fieldChanges,
      });
    }
    if (invalidatedCount > 0) {
      appendHistoryEvent(batch, wardId, date, actor, {
        target: "approval",
        targetId: date,
        action: "update",
        changes: [{ field: "invalidated", new: invalidatedCount }],
      });
    }
  }

  await batch.commit();
}
