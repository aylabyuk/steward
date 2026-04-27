import { collection, doc, serverTimestamp, writeBatch } from "firebase/firestore";
import { writeMeetingPatch } from "@/features/meetings/utils/approvals";
import { ensureMeetingDoc } from "@/features/meetings/utils/ensureMeetingDoc";
import { appendHistoryEvent, currentActor } from "@/features/meetings/utils/history";
import { db } from "@/lib/firebase";
import { reportSaved, reportSaveError, reportSaving } from "@/stores/saveStatusStore";
import type { HistoryChange, NonMeetingSunday, SpeakerRole, SpeakerStatus } from "@/lib/types";

export { reorderSpeakers } from "./reorderSpeakers";

/** Surface save errors to the inline save-status indicator and re-throw
 *  so callers can still handle them (e.g. abort the rest of a batch
 *  save, or render a local error message next to a dialog button). */
async function withSaveError<T>(fn: () => Promise<T>): Promise<T> {
  reportSaving();
  try {
    const result = await fn();
    reportSaved();
    return result;
  } catch (e) {
    reportSaveError(e);
    throw e;
  }
}

function speakerRef(wardId: string, date: string, speakerId: string) {
  return doc(db, "wards", wardId, "meetings", date, "speakers", speakerId);
}

export interface CreateSpeakerInput {
  wardId: string;
  date: string;
  name: string;
  nonMeetingSundays: readonly NonMeetingSunday[];
  email?: string | undefined;
  phone?: string | undefined;
  topic?: string | undefined;
  role?: SpeakerRole | undefined;
}

export async function createSpeaker(input: CreateSpeakerInput): Promise<string> {
  return withSaveError(async () => {
    // Creating a speaker before the meeting doc exists would orphan the
    // subcollection entry. Ensure the parent meeting is there first.
    await ensureMeetingDoc(input.wardId, input.date, input.nonMeetingSundays);
    const ref = doc(collection(db, "wards", input.wardId, "meetings", input.date, "speakers"));
    const actor = currentActor();
    const data: Record<string, unknown> = {
      name: input.name,
      status: "planned",
      role: input.role || "Member",
      statusSource: "manual",
      statusSetAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (actor) data.statusSetBy = actor.uid;
    if (input.email) data.email = input.email;
    if (input.phone) data.phone = input.phone;
    if (input.topic) data.topic = input.topic;

    const batch = writeBatch(db);
    batch.set(ref, data);
    if (actor) {
      const changes: HistoryChange[] = [{ field: "name", new: input.name }];
      if (input.topic) changes.push({ field: "topic", new: input.topic });
      appendHistoryEvent(batch, input.wardId, input.date, actor, {
        target: "speaker",
        targetId: ref.id,
        action: "create",
        changes,
      });
    }
    await batch.commit();
    await writeMeetingPatch(input.wardId, input.date, {});
    return ref.id;
  });
}

export async function updateSpeaker(
  wardId: string,
  date: string,
  speakerId: string,
  updates: Partial<{
    name: string;
    email: string;
    phone: string;
    topic: string;
    status: SpeakerStatus;
    role: SpeakerRole;
    order: number;
  }>,
): Promise<void> {
  return withSaveError(async () => {
    const actor = currentActor();
    const data: Record<string, unknown> = { updatedAt: serverTimestamp(), ...updates };
    // Status changes authored here are bishopric-initiated overrides;
    // speaker-response confirmations flow through applyResponseToSpeaker
    // and stamp "speaker-response" there. Surfacing the source next to
    // the badge lets the team audit who changed what.
    if ("status" in updates) {
      data.statusSource = "manual";
      data.statusSetAt = serverTimestamp();
      if (actor) data.statusSetBy = actor.uid;
    }
    const batch = writeBatch(db);
    batch.update(speakerRef(wardId, date, speakerId), data);

    if (actor) {
      const changes: HistoryChange[] = Object.entries(updates).map(([field, value]) => ({
        field,
        new: value,
      }));
      appendHistoryEvent(batch, wardId, date, actor, {
        target: "speaker",
        targetId: speakerId,
        action: "update",
        changes,
      });
    }
    await batch.commit();
    await writeMeetingPatch(wardId, date, {});
  });
}

export async function deleteSpeaker(
  wardId: string,
  date: string,
  speakerId: string,
): Promise<void> {
  return withSaveError(async () => {
    const batch = writeBatch(db);
    batch.delete(speakerRef(wardId, date, speakerId));
    const actor = currentActor();
    if (actor) {
      appendHistoryEvent(batch, wardId, date, actor, {
        target: "speaker",
        targetId: speakerId,
        action: "delete",
        changes: [],
      });
    }
    await batch.commit();
    await writeMeetingPatch(wardId, date, {});
  });
}
