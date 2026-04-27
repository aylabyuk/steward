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
 * Create the meeting doc if it doesn't already exist, OR backfill the
 * required `meetingType` + `status` fields if a partial doc exists
 * (e.g. an earlier writer used `setDoc(merge: true)` on a missing doc
 * and only seeded a sub-field). Runs in a transaction so two parallel
 * callers can't both pass the exists-check and clobber each other.
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
    const data = snap.exists() ? snap.data() : null;
    const missingMeetingType = !data?.meetingType;
    const missingStatus = !data?.status;
    if (snap.exists() && !missingMeetingType && !missingStatus) return;
    if (!snap.exists()) {
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
    } else {
      const patch: Record<string, unknown> = { updatedAt: serverTimestamp() };
      if (missingMeetingType) patch.meetingType = meetingType;
      if (missingStatus) patch.status = "draft";
      tx.set(ref, patch, { merge: true });
    }
    if (actor) {
      appendHistoryEvent(tx, wardId, isoDate, actor, {
        target: "meeting",
        targetId: isoDate,
        action: snap.exists() ? "update" : "create",
        changes: [{ field: "meetingType", new: meetingType }],
      });
    }
  });
}
