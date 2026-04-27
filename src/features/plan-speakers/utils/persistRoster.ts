import {
  createSpeaker,
  deleteSpeaker,
  updateSpeaker,
} from "@/features/speakers/utils/speakerActions";
import type { NonMeetingSunday } from "@/lib/types";
import { isDirty, type RosterDraft } from "./rosterDraft";

interface Args {
  wardId: string;
  date: string;
  nonMeetingSundays: readonly NonMeetingSunday[];
  drafts: RosterDraft[];
  originals: Map<string, RosterDraft>;
  deletedIds: string[];
}

/** Persist roster drafts to Firestore. Mutations run serially because
 *  each speaker write recomputes the meeting content hash; parallel
 *  writes would race on stale snapshots. */
export async function persistRoster(args: Args): Promise<RosterDraft[]> {
  const { wardId, date, nonMeetingSundays, drafts, originals, deletedIds } = args;

  for (const id of deletedIds) {
    await deleteSpeaker(wardId, date, id);
  }

  const next: RosterDraft[] = [];
  for (const d of drafts) {
    const name = d.name.trim();
    if (!name) continue;
    if (d.id === null) {
      const newId = await createSpeaker({
        wardId,
        date,
        nonMeetingSundays,
        name,
        role: d.role,
        ...(d.topic.trim() ? { topic: d.topic.trim() } : {}),
      });
      const persisted: RosterDraft = { ...d, id: newId, name };
      originals.set(d.tempId, { ...persisted });
      next.push(persisted);
    } else {
      const original = originals.get(d.tempId) ?? null;
      if (!isDirty(d, original)) {
        next.push(d);
        continue;
      }
      await updateSpeaker(wardId, date, d.id, {
        name,
        topic: d.topic.trim(),
        role: d.role,
      });
      originals.set(d.tempId, { ...d, name });
      next.push({ ...d, name });
    }
  }
  return next;
}
