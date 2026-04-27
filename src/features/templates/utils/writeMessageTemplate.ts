import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { MessageTemplateKey } from "@/lib/types";
import { reportSaved, reportSaveError, reportSaving } from "@/stores/saveStatusStore";

/**
 * Write one of the six server-side messaging templates to
 * `wards/{wardId}/templates/{key}`. Any active bishopric or clerk
 * member can edit per the shared template rule.
 */
export async function writeMessageTemplate(
  wardId: string,
  key: MessageTemplateKey,
  input: { bodyMarkdown: string },
): Promise<void> {
  reportSaving();
  try {
    await setDoc(doc(db, "wards", wardId, "templates", key), {
      bodyMarkdown: input.bodyMarkdown,
      updatedAt: serverTimestamp(),
    });
    reportSaved();
  } catch (e) {
    reportSaveError(e);
    throw e;
  }
}
