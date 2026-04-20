import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { NonMeetingSunday, SacramentMeeting } from "@/lib/types";
import { ensureMeetingDoc } from "./ensureMeetingDoc";

export async function updateMeetingField(
  wardId: string,
  date: string,
  nonMeetingSundays: readonly NonMeetingSunday[],
  patch: Partial<SacramentMeeting>,
): Promise<void> {
  await ensureMeetingDoc(wardId, date, nonMeetingSundays);
  await updateDoc(doc(db, "wards", wardId, "meetings", date), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}

export async function cancelMeeting(
  wardId: string,
  date: string,
  reason: string,
  actorUid: string,
  nonMeetingSundays: readonly NonMeetingSunday[],
): Promise<void> {
  await ensureMeetingDoc(wardId, date, nonMeetingSundays);
  await updateDoc(doc(db, "wards", wardId, "meetings", date), {
    cancellation: {
      cancelled: true,
      reason,
      cancelledAt: serverTimestamp(),
      cancelledBy: actorUid,
    },
    updatedAt: serverTimestamp(),
  });
}

export async function uncancelMeeting(wardId: string, date: string): Promise<void> {
  await updateDoc(doc(db, "wards", wardId, "meetings", date), {
    cancellation: null,
    updatedAt: serverTimestamp(),
  });
}
