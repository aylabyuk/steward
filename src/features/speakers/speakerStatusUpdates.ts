import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { writeMeetingPatch } from "@/features/meetings/approvals";
import { db } from "@/lib/firebase";
import type { AssignmentStatus } from "@/lib/types";

function speakerRef(wardId: string, date: string, speakerId: string) {
  return doc(db, "wards", wardId, "meetings", date, "speakers", speakerId);
}

export async function markSpeakerSent(
  wardId: string,
  date: string,
  speakerId: string,
  status: "invite_emailed" | "invite_printed",
  sentBy: string,
): Promise<void> {
  await updateDoc(speakerRef(wardId, date, speakerId), {
    status,
    sentAt: serverTimestamp(),
    sentBy,
    updatedAt: serverTimestamp(),
  });
  await writeMeetingPatch(wardId, date, {});
}

export async function revertSpeakerSent(
  wardId: string,
  date: string,
  speakerId: string,
  previousStatus: AssignmentStatus,
): Promise<void> {
  await updateDoc(speakerRef(wardId, date, speakerId), {
    status: previousStatus,
    updatedAt: serverTimestamp(),
  });
  await writeMeetingPatch(wardId, date, {});
}
