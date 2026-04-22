import { deleteField, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { reportSaved, reportSaveError, reportSaving } from "@/stores/saveStatusStore";

function speakerRef(wardId: string, date: string, speakerId: string) {
  return doc(db, "wards", wardId, "meetings", date, "speakers", speakerId);
}

export interface LetterOverrideInput {
  bodyMarkdown: string;
  footerMarkdown: string;
}

/**
 * Write a per-speaker override of the ward invitation letter template.
 * Stored as Markdown with `{{variable}}` tokens intact — variables are
 * resolved at send time (see `sendSpeakerInvitation`). The override
 * persists on the speaker doc until explicitly cleared.
 */
export async function saveSpeakerLetterOverride(
  wardId: string,
  date: string,
  speakerId: string,
  input: LetterOverrideInput,
): Promise<void> {
  reportSaving();
  try {
    await updateDoc(speakerRef(wardId, date, speakerId), {
      letterOverride: {
        bodyMarkdown: input.bodyMarkdown,
        footerMarkdown: input.footerMarkdown,
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
