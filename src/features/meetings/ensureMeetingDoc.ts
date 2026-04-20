import { doc, getDoc, serverTimestamp, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { isFirstSundayOfMonth } from "@/lib/dates";
import type { MeetingType, NonMeetingSunday } from "@/lib/types";
import { appendHistoryEvent, currentActor } from "./history";

export function defaultMeetingType(
  isoDate: string,
  nonMeetingSundays: readonly NonMeetingSunday[],
): MeetingType {
  const override = nonMeetingSundays.find((s) => s.date === isoDate);
  if (override) return override.type;
  if (isFirstSundayOfMonth(isoDate)) return "fast";
  return "regular";
}

export async function ensureMeetingDoc(
  wardId: string,
  isoDate: string,
  nonMeetingSundays: readonly NonMeetingSunday[],
): Promise<void> {
  const ref = doc(db, "wards", wardId, "meetings", isoDate);
  const snap = await getDoc(ref);
  if (snap.exists()) return;
  const meetingType = defaultMeetingType(isoDate, nonMeetingSundays);
  const batch = writeBatch(db);
  batch.set(ref, {
    meetingType,
    status: "draft",
    approvals: [],
    wardBusiness: "",
    stakeBusiness: "",
    announcements: "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  const actor = currentActor();
  if (actor) {
    appendHistoryEvent(batch, wardId, isoDate, actor, {
      target: "meeting",
      targetId: isoDate,
      action: "create",
      changes: [{ field: "meetingType", new: meetingType }],
    });
  }
  await batch.commit();
}
