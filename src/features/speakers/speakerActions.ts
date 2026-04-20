import { collection, doc, serverTimestamp, writeBatch } from "firebase/firestore";
import { writeMeetingPatch } from "@/features/meetings/approvals";
import { appendHistoryEvent, currentActor } from "@/features/meetings/history";
import { db } from "@/lib/firebase";
import type { AssignmentStatus, HistoryChange } from "@/lib/types";

function speakerRef(wardId: string, date: string, speakerId: string) {
  return doc(db, "wards", wardId, "meetings", date, "speakers", speakerId);
}

export interface CreateSpeakerInput {
  wardId: string;
  date: string;
  name: string;
  email?: string;
  topic?: string;
}

export async function createSpeaker(input: CreateSpeakerInput): Promise<void> {
  const ref = doc(collection(db, "wards", input.wardId, "meetings", input.date, "speakers"));
  const data: Record<string, unknown> = {
    name: input.name,
    status: "not_assigned",
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

export async function markSpeakerSent(
  wardId: string,
  date: string,
  speakerId: string,
  status: "invite_emailed" | "invite_printed",
  sentBy: string,
): Promise<void> {
  const batch = writeBatch(db);
  batch.update(speakerRef(wardId, date, speakerId), {
    status,
    sentAt: serverTimestamp(),
    sentBy,
    updatedAt: serverTimestamp(),
  });
  const actor = currentActor();
  if (actor) {
    appendHistoryEvent(batch, wardId, date, actor, {
      target: "speaker",
      targetId: speakerId,
      action: "update",
      changes: [{ field: "status", new: status }],
    });
  }
  await batch.commit();
  await writeMeetingPatch(wardId, date, {});
}

export async function revertSpeakerSent(
  wardId: string,
  date: string,
  speakerId: string,
  previousStatus: AssignmentStatus,
): Promise<void> {
  const batch = writeBatch(db);
  batch.update(speakerRef(wardId, date, speakerId), {
    status: previousStatus,
    updatedAt: serverTimestamp(),
  });
  const actor = currentActor();
  if (actor) {
    appendHistoryEvent(batch, wardId, date, actor, {
      target: "speaker",
      targetId: speakerId,
      action: "update",
      changes: [{ field: "status", new: previousStatus }],
    });
  }
  await batch.commit();
  await writeMeetingPatch(wardId, date, {});
}

export async function saveSpeakerLetter(
  wardId: string,
  date: string,
  speakerId: string,
  body: string,
): Promise<void> {
  const batch = writeBatch(db);
  batch.update(speakerRef(wardId, date, speakerId), {
    letterBody: body,
    letterUpdatedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  const actor = currentActor();
  if (actor) {
    // Letter bodies can be long; record the change without the value to keep
    // history compact. The letterUpdatedAt timestamp on the speaker doc covers
    // when the body last changed.
    appendHistoryEvent(batch, wardId, date, actor, {
      target: "speaker",
      targetId: speakerId,
      action: "update",
      changes: [{ field: "letterBody" }],
    });
  }
  await batch.commit();
  await writeMeetingPatch(wardId, date, {});
}
