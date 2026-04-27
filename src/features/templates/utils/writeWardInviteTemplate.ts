import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { reportSaved, reportSaveError, reportSaving } from "@/stores/saveStatusStore";

export interface WardInviteTemplateInput {
  bodyMarkdown: string;
}

/**
 * Write the ward-member invitation message template. Any active member
 * (bishopric or clerk) may edit per the shared template rule at
 * `wards/{wardId}/templates/{templateId}`.
 */
export async function writeWardInviteTemplate(
  wardId: string,
  input: WardInviteTemplateInput,
): Promise<void> {
  reportSaving();
  try {
    await setDoc(doc(db, "wards", wardId, "templates", "wardInvite"), {
      bodyMarkdown: input.bodyMarkdown,
      updatedAt: serverTimestamp(),
    });
    reportSaved();
  } catch (e) {
    reportSaveError(e);
    throw e;
  }
}
