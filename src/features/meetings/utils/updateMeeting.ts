import { doc, serverTimestamp, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { reportSaved, reportSaveError, reportSaving } from "@/stores/saveStatusStore";
import type { NonMeetingSunday, SacramentMeeting } from "@/lib/types";
import { ensureMeetingDoc } from "./ensureMeetingDoc";
import { appendHistoryEvent, currentActor } from "./history";
import { writeMeetingPatch } from "./writeMeetingPatch";

export async function updateMeetingField(
  wardId: string,
  date: string,
  nonMeetingSundays: readonly NonMeetingSunday[],
  patch: Partial<SacramentMeeting>,
): Promise<void> {
  reportSaving();
  try {
    await ensureMeetingDoc(wardId, date, nonMeetingSundays);
    await writeMeetingPatch(wardId, date, patch);
    reportSaved();
  } catch (e) {
    reportSaveError(e);
    throw e;
  }
}

export async function cancelMeeting(
  wardId: string,
  date: string,
  reason: string,
  actorUid: string,
  nonMeetingSundays: readonly NonMeetingSunday[],
): Promise<void> {
  await ensureMeetingDoc(wardId, date, nonMeetingSundays);
  // Cancellation is excluded from the content hash, so this is a direct
  // update — no re-hash needed.
  const batch = writeBatch(db);
  batch.update(doc(db, "wards", wardId, "meetings", date), {
    cancellation: {
      cancelled: true,
      reason,
      cancelledAt: serverTimestamp(),
      cancelledBy: actorUid,
    },
    updatedAt: serverTimestamp(),
  });
  const actor = currentActor();
  if (actor) {
    appendHistoryEvent(batch, wardId, date, actor, {
      target: "meeting",
      targetId: date,
      action: "update",
      changes: [{ field: "cancellation", new: { cancelled: true, reason } }],
    });
  }
  await batch.commit();
}

export async function uncancelMeeting(wardId: string, date: string): Promise<void> {
  const batch = writeBatch(db);
  batch.update(doc(db, "wards", wardId, "meetings", date), {
    cancellation: null,
    updatedAt: serverTimestamp(),
  });
  const actor = currentActor();
  if (actor) {
    appendHistoryEvent(batch, wardId, date, actor, {
      target: "meeting",
      targetId: date,
      action: "update",
      changes: [{ field: "cancellation", old: { cancelled: true } }],
    });
  }
  await batch.commit();
}
