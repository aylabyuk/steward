import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { InvitationStatus, PrayerRole } from "@/lib/types";
import { useAuthStore } from "@/stores/authStore";
import { reportSaved, reportSaveError, reportSaving } from "@/stores/saveStatusStore";

interface PrayerUpsertPatch {
  name?: string;
  email?: string;
  phone?: string;
  status?: InvitationStatus;
  /** When set, override the default "manual" provenance written
   *  alongside a status change. `applyResponseToSpeaker` passes
   *  "speaker-response" so the audit line distinguishes a
   *  bishop-initiated override from a speaker-driven Yes/No. */
  statusSource?: "manual" | "speaker-response";
}

/** Upsert the prayer participant doc at
 *  `wards/{wardId}/meetings/{date}/prayers/{role}`. Uses
 *  `setDoc(..., { merge: true })` so the bishop's first action on a
 *  prayer (Send / Mark invited) creates the doc lazily — the
 *  lightweight inline `meeting.openingPrayer` Assignment row is the
 *  source of truth until then.
 *
 *  When `patch.status` is set, mirrors the speaker writer's audit
 *  trail — stamps `statusSource`, `statusSetBy`, and
 *  `statusSetAt` so the schedule view's status-provenance line stays
 *  meaningful for prayer rows too. */
export async function upsertPrayerParticipant(
  wardId: string,
  date: string,
  role: PrayerRole,
  patch: PrayerUpsertPatch,
): Promise<void> {
  reportSaving();
  try {
    const data: Record<string, unknown> = {
      role,
      ...patch,
      updatedAt: serverTimestamp(),
    };
    if ("status" in patch) {
      const actor = useAuthStore.getState().user;
      data.statusSource = patch.statusSource ?? "manual";
      data.statusSetAt = serverTimestamp();
      if (actor?.uid) data.statusSetBy = actor.uid;
    }
    await setDoc(doc(db, "wards", wardId, "meetings", date, "prayers", role), data, {
      merge: true,
    });
    reportSaved();
  } catch (e) {
    reportSaveError(e);
    throw e;
  }
}
