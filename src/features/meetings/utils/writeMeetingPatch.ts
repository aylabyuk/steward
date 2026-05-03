import { collection, doc, getDocs, runTransaction, serverTimestamp } from "firebase/firestore";
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
 * Applies `patch` to the meeting doc and recomputes `contentVersionHash`
 * from the (post-patch) content + current speakers. The meeting-change
 * Cloud Function watches the hash to decide whether to fan out a
 * notification, so every content edit goes through this path.
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

    tx.update(ref, {
      ...patch,
      contentVersionHash: newHash,
      updatedAt: serverTimestamp(),
    });

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
