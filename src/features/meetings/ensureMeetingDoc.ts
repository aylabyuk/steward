import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
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

/**
 * Create the meeting doc if it doesn't already exist. Runs in a
 * transaction so two parallel callers (e.g. the WeekEditor effect racing
 * createSpeaker's own ensureMeetingDoc) can't both pass the exists-check
 * and clobber each other.
 */
export async function ensureMeetingDoc(
  wardId: string,
  isoDate: string,
  nonMeetingSundays: readonly NonMeetingSunday[],
): Promise<void> {
  const ref = doc(db, "wards", wardId, "meetings", isoDate);
  const meetingType = defaultMeetingType(isoDate, nonMeetingSundays);
  const actor = currentActor();
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists()) return;
    tx.set(ref, {
      meetingType,
      status: "draft",
      approvals: [],
      wardBusiness: "",
      stakeBusiness: "",
      announcements: "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    if (actor) {
      appendHistoryEvent(tx, wardId, isoDate, actor, {
        target: "meeting",
        targetId: isoDate,
        action: "create",
        changes: [{ field: "meetingType", new: meetingType }],
      });
    }
  });
}
