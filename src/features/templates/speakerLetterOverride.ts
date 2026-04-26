import { deleteField, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { reportSaved, reportSaveError, reportSaving } from "@/stores/saveStatusStore";
import { legacyFieldsFromState } from "@/features/page-editor/serializeForInterpolation";

function speakerRef(wardId: string, date: string, speakerId: string) {
  return doc(db, "wards", wardId, "meetings", date, "speakers", speakerId);
}

export interface LetterOverrideInput {
  /** Lexical EditorState JSON — the new source of truth. Required so
   *  the writer can derive legacy markdown fields. */
  editorStateJson: string;
}

/**
 * Write a per-speaker override of the ward invitation letter template.
 * Dual-writes: stores Lexical EditorState JSON alongside derived
 * `bodyMarkdown` / `footerMarkdown` fields so older readers (the
 * Cloud Function send path, receipt emails, the print path during
 * migration) keep working unchanged. The override persists on the
 * speaker doc until explicitly cleared.
 */
export async function saveSpeakerLetterOverride(
  wardId: string,
  date: string,
  speakerId: string,
  input: LetterOverrideInput,
): Promise<void> {
  reportSaving();
  try {
    const state = JSON.parse(input.editorStateJson);
    const { bodyMarkdown, footerMarkdown } = legacyFieldsFromState(state);
    await updateDoc(speakerRef(wardId, date, speakerId), {
      letterOverride: {
        editorStateJson: input.editorStateJson,
        bodyMarkdown,
        footerMarkdown,
        updatedAt: serverTimestamp(),
      },
      updatedAt: serverTimestamp(),
    });
    reportSaved();
  } catch (e) {
    reportSaveError(e);
    throw e;
  }
}

/** Remove a per-speaker override so the next send falls back to the
 *  ward default template. */
export async function clearSpeakerLetterOverride(
  wardId: string,
  date: string,
  speakerId: string,
): Promise<void> {
  reportSaving();
  try {
    await updateDoc(speakerRef(wardId, date, speakerId), {
      letterOverride: deleteField(),
      updatedAt: serverTimestamp(),
    });
    reportSaved();
  } catch (e) {
    reportSaveError(e);
    throw e;
  }
}
