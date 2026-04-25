import { createSpeaker, deleteSpeaker, updateSpeaker } from "@/features/speakers/speakerActions";
import type { NonMeetingSunday } from "@/lib/types";
import { isDirty, type Draft } from "./speakerDraft";

interface Args {
  drafts: readonly Draft[];
  deletedIds: readonly string[];
  wardId: string;
  date: string;
  nonMeetingSundays: readonly NonMeetingSunday[];
  /** Mutated in place: persisted drafts (whether freshly created
   *  or just-updated) are written back so a subsequent isDirty()
   *  check correctly sees them as clean. */
  originals: Map<string, Draft>;
}

interface Result {
  /** New draft list to feed back into setDrafts. Persisted drafts
   *  carry their server `id` so a follow-up save doesn't fire
   *  createSpeaker again. */
  nextDrafts: Draft[];
  /** Speakers still in `status === "planned"` after save — used by
   *  the caller to decide post-save UX. */
  plannedCount: number;
}

/** Pushes every queued draft mutation to Firestore, serially.
 *
 *  - Each mutation internally calls writeMeetingPatch to recompute
 *    the meeting content hash. Parallel writes would read stale
 *    speaker snapshots, so the final hash wouldn't reflect the
 *    final speaker set.
 *  - Drafts with `id === null` get createSpeaker; the returned doc
 *    id is patched back onto the draft + originals snapshot so the
 *    speaker counts as "persisted" on subsequent saves (otherwise
 *    a re-save would fire another create and duplicate the row).
 *  - Drafts with `id !== null` only get updateSpeaker if they're
 *    dirty against their originals snapshot.
 */
export async function persistDrafts({
  drafts,
  deletedIds,
  wardId,
  date,
  nonMeetingSundays,
  originals,
}: Args): Promise<Result> {
  for (const id of deletedIds) {
    await deleteSpeaker(wardId, date, id);
  }
  let plannedCount = 0;
  const nextDrafts: Draft[] = [];
  for (const d of drafts) {
    const name = d.name.trim();
    if (!name) {
      nextDrafts.push(d);
      continue;
    }
    if (d.status === "planned") plannedCount += 1;
    if (d.id === null) {
      const newId = await createSpeaker({
        wardId,
        date,
        nonMeetingSundays,
        name,
        email: d.email.trim() || undefined,
        phone: d.phone.trim() || undefined,
        topic: d.topic.trim() || undefined,
        role: d.role,
      });
      const persisted: Draft = { ...d, id: newId };
      originals.set(d.tempId, { ...persisted });
      nextDrafts.push(persisted);
      continue;
    }
    const original = originals.get(d.tempId) ?? null;
    if (!isDirty(d, original)) {
      nextDrafts.push(d);
      continue;
    }
    await updateSpeaker(wardId, date, d.id, {
      name,
      email: d.email.trim(),
      phone: d.phone.trim(),
      topic: d.topic.trim(),
      role: d.role,
      status: d.status,
    });
    originals.set(d.tempId, { ...d });
    nextDrafts.push(d);
  }
  return { nextDrafts, plannedCount };
}
