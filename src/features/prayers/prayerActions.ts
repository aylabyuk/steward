import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { InvitationStatus, PrayerRole } from "@/lib/types";
import { reportSaved, reportSaveError, reportSaving } from "@/stores/saveStatusStore";

interface PrayerUpsertPatch {
  name?: string;
  email?: string;
  phone?: string;
  status?: InvitationStatus;
}

/** Upsert the prayer participant doc at
 *  `wards/{wardId}/meetings/{date}/prayers/{role}`. Uses
 *  `setDoc(..., { merge: true })` so the bishop's first action on a
 *  prayer (Send / Mark invited) creates the doc lazily — the
 *  lightweight inline `meeting.openingPrayer` Assignment row is the
 *  source of truth until then. */
export async function upsertPrayerParticipant(
  wardId: string,
  date: string,
  role: PrayerRole,
  patch: PrayerUpsertPatch,
): Promise<void> {
  reportSaving();
  try {
    await setDoc(
      doc(db, "wards", wardId, "meetings", date, "prayers", role),
      {
        role,
        ...patch,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
    reportSaved();
  } catch (e) {
    reportSaveError(e);
    throw e;
  }
}
