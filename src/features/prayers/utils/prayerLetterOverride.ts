import { deleteField, doc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { PrayerRole } from "@/lib/types";
import { reportSaved, reportSaveError, reportSaving } from "@/stores/saveStatusStore";
import { legacyFieldsFromState } from "@/features/page-editor/utils/serializeForInterpolation";

function prayerRef(wardId: string, date: string, role: PrayerRole) {
  return doc(db, "wards", wardId, "meetings", date, "prayers", role);
}

export interface PrayerOverrideInput {
  /** Lexical EditorState JSON — the new source of truth. Required so
   *  the writer can derive legacy markdown fields. */
  editorStateJson: string;
}

/** Write a per-prayer override of the ward invitation letter
 *  template. Mirrors the speaker-side override writer but targets
 *  the prayer participant doc at
 *  `wards/{wardId}/meetings/{date}/prayers/{role}`. Uses `setDoc(...,
 *  { merge: true })` so the doc gets created if the bishop is
 *  authoring an override before the participant has otherwise been
 *  promoted out of the lightweight inline `Assignment` row. */
export async function savePrayerLetterOverride(
  wardId: string,
  date: string,
  role: PrayerRole,
  input: PrayerOverrideInput,
): Promise<void> {
  reportSaving();
  try {
    const state = JSON.parse(input.editorStateJson);
    const { bodyMarkdown, footerMarkdown } = legacyFieldsFromState(state);
    await setDoc(
      prayerRef(wardId, date, role),
      {
        role,
        letterOverride: {
          editorStateJson: input.editorStateJson,
          bodyMarkdown,
          footerMarkdown,
          updatedAt: serverTimestamp(),
        },
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

export async function clearPrayerLetterOverride(
  wardId: string,
  date: string,
  role: PrayerRole,
): Promise<void> {
  reportSaving();
  try {
    await updateDoc(prayerRef(wardId, date, role), {
      letterOverride: deleteField(),
      updatedAt: serverTimestamp(),
    });
    reportSaved();
  } catch (e) {
    reportSaveError(e);
    throw e;
  }
}
