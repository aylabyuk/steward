import { collection, doc, serverTimestamp, writeBatch } from "firebase/firestore";
import { writeMeetingPatch } from "@/features/meetings/approvals";
import { appendHistoryEvent, currentActor } from "@/features/meetings/history";
import { db } from "@/lib/firebase";
import type { HistoryChange, SpeakerRole, SpeakerStatus } from "@/lib/types";

function speakerRef(wardId: string, date: string, speakerId: string) {
  return doc(db, "wards", wardId, "meetings", date, "speakers", speakerId);
}

export interface CreateSpeakerInput {
  wardId: string;
  date: string;
  name: string;
  email?: string;
  topic?: string;
  role?: SpeakerRole;
}

export async function createSpeaker(input: CreateSpeakerInput): Promise<void> {
  const ref = doc(collection(db, "wards", input.wardId, "meetings", input.date, "speakers"));
  const data: Record<string, unknown> = {
    name: input.name,
    status: "planned",
    role: input.role || "Member",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (input.email) data.email = input.email;
  if (input.topic) data.topic = input.topic;

  const batch = writeBatch(db);
  batch.set(ref, data);
  const actor = currentActor();
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
}

export async function updateSpeaker(
  wardId: string,
  date: string,
  speakerId: string,
  updates: Partial<{
    name: string;
    email: string;
    topic: string;
    status: SpeakerStatus;
    role: SpeakerRole;
  }>,
): Promise<void> {
  const data: Record<string, unknown> = { updatedAt: serverTimestamp(), ...updates };
  const batch = writeBatch(db);
  batch.update(speakerRef(wardId, date, speakerId), data);

  const actor = currentActor();
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
}
