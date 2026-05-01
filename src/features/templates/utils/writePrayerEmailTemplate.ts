import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { reportSaved, reportSaveError, reportSaving } from "@/stores/saveStatusStore";

export interface PrayerEmailTemplateInput {
  bodyMarkdown: string;
}

/**
 * Write the prayer-giver invitation email body template. Any active
 * bishopric or clerk member can edit per the shared template rule at
 * `wards/{wardId}/templates/{templateId}`.
 */
export async function writePrayerEmailTemplate(
  wardId: string,
  input: PrayerEmailTemplateInput,
): Promise<void> {
  reportSaving();
  try {
    await setDoc(doc(db, "wards", wardId, "templates", "prayerEmail"), {
      bodyMarkdown: input.bodyMarkdown,
      updatedAt: serverTimestamp(),
    });
    reportSaved();
  } catch (e) {
    reportSaveError(e);
    throw e;
  }
}
