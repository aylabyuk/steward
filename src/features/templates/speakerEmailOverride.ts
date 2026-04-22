import { deleteField, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { reportSaved, reportSaveError, reportSaving } from "@/stores/saveStatusStore";

function speakerRef(wardId: string, date: string, speakerId: string) {
  return doc(db, "wards", wardId, "meetings", date, "speakers", speakerId);
}

export interface EmailOverrideInput {
  bodyMarkdown: string;
}

/**
 * Write a per-speaker override of the ward speaker-email body template.
 * Stored with `{{variable}}` tokens intact; resolved at send time.
 * Sibling to `saveSpeakerLetterOverride` — same pattern, different
 * surface (plain-text mailto body vs. rich letter on landing page).
 */
export async function saveSpeakerEmailOverride(
  wardId: string,
  date: string,
  speakerId: string,
  input: EmailOverrideInput,
): Promise<void> {
  reportSaving();
  try {
    await updateDoc(speakerRef(wardId, date, speakerId), {
      emailOverride: {
        bodyMarkdown: input.bodyMarkdown,
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

/** Remove the per-speaker email override so the next send falls back
 *  to the ward default template. */
export async function clearSpeakerEmailOverride(
  wardId: string,
  date: string,
  speakerId: string,
): Promise<void> {
  reportSaving();
  try {
    await updateDoc(speakerRef(wardId, date, speakerId), {
      emailOverride: deleteField(),
      updatedAt: serverTimestamp(),
    });
    reportSaved();
  } catch (e) {
    reportSaveError(e);
    throw e;
  }
}
