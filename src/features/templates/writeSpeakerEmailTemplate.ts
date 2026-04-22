import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { reportSaved, reportSaveError, reportSaving } from "@/stores/saveStatusStore";

export interface SpeakerEmailTemplateInput {
  bodyMarkdown: string;
}

/**
 * Write the speaker invitation **email body** template. Any active
 * bishopric or clerk member can edit per the shared template rule at
 * `wards/{wardId}/templates/{templateId}`.
 */
export async function writeSpeakerEmailTemplate(
  wardId: string,
  input: SpeakerEmailTemplateInput,
): Promise<void> {
  reportSaving();
  try {
    await setDoc(doc(db, "wards", wardId, "templates", "speakerEmail"), {
      bodyMarkdown: input.bodyMarkdown,
      updatedAt: serverTimestamp(),
    });
    reportSaved();
  } catch (e) {
    reportSaveError(e);
    throw e;
  }
}
