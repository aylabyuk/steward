import { doc, serverTimestamp, setDoc, writeBatch } from "firebase/firestore";
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

const MEETING_FIELD: Record<PrayerRole, "openingPrayer" | "benediction"> = {
  opening: "openingPrayer",
  benediction: "benediction",
};

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
 *  meaningful for prayer rows too.
 *
 *  Mirrors `name` + `confirmed` (from `status === "confirmed"`)
 *  back onto the meeting doc's `openingPrayer` / `benediction`
 *  Assignment row in the same batch — the printed program template
 *  reads these chips out of the meeting doc, so without the mirror
 *  a wizard-driven prayer would print as an empty slot. */
export async function upsertPrayerParticipant(
  wardId: string,
  date: string,
  role: PrayerRole,
  patch: PrayerUpsertPatch,
): Promise<void> {
  reportSaving();
  try {
    const participantData: Record<string, unknown> = {
      role,
      ...patch,
      updatedAt: serverTimestamp(),
    };
    if ("status" in patch) {
      const actor = useAuthStore.getState().user;
      participantData.statusSource = patch.statusSource ?? "manual";
      participantData.statusSetAt = serverTimestamp();
      if (actor?.uid) participantData.statusSetBy = actor.uid;
    }

    // Mirror name + confirmed back to the inline meeting assignment
    // row (`meeting.openingPrayer` / `meeting.benediction`) so the
    // printed program template — which reads from the meeting doc,
    // not the prayer participant — stays in sync. Uses a nested
    // object so `setDoc(..., { merge: true })` deep-merges and
    // doesn't clobber sibling fields. `confirmed` only mirrors when
    // status is in the patch, leaving the inline toggle alone on
    // name-only edits.
    const fieldUpdate: Record<string, unknown> = {};
    if (typeof patch.name === "string") {
      fieldUpdate.person = { name: patch.name.trim() };
    }
    if (patch.status) {
      fieldUpdate.confirmed = patch.status === "confirmed";
    }
    const hasMirror = Object.keys(fieldUpdate).length > 0;

    const participantRef = doc(db, "wards", wardId, "meetings", date, "prayers", role);
    if (!hasMirror) {
      await setDoc(participantRef, participantData, { merge: true });
    } else {
      const batch = writeBatch(db);
      batch.set(participantRef, participantData, { merge: true });
      batch.set(
        doc(db, "wards", wardId, "meetings", date),
        { [MEETING_FIELD[role]]: fieldUpdate },
        { merge: true },
      );
      await batch.commit();
    }
    reportSaved();
  } catch (e) {
    reportSaveError(e);
    throw e;
  }
}
