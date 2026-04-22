import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { reportSaved, reportSaveError, reportSaving } from "@/stores/saveStatusStore";

export interface SpeakerLetterTemplateInput {
  bodyMarkdown: string;
  footerMarkdown: string;
}

/**
 * Write the speaker invitation letter template for a ward. Any active
 * bishopric or clerk member can update it — see the Firestore rule for
 * the `wards/{wardId}/templates/{templateId}` path.
 */
export async function writeSpeakerLetterTemplate(
  wardId: string,
  input: SpeakerLetterTemplateInput,
): Promise<void> {
  reportSaving();
  try {
    await setDoc(doc(db, "wards", wardId, "templates", "speakerLetter"), {
      bodyMarkdown: input.bodyMarkdown,
      footerMarkdown: input.footerMarkdown,
      updatedAt: serverTimestamp(),
    });
    reportSaved();
  } catch (e) {
    reportSaveError(e);
    throw e;
  }
}
