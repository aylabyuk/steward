import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { LetterPageStyle, ProgramMargins, ProgramTemplateKey } from "@/lib/types";
import { reportSaved, reportSaveError, reportSaving } from "@/stores/saveStatusStore";

/** Write the conducting / congregation program template for a ward.
 *  Same path shape as the speaker-letter template — any active member
 *  permission rules apply (Firestore rule for
 *  `wards/{wardId}/templates/{templateId}` covers this path). */
export async function writeProgramTemplate(
  wardId: string,
  key: ProgramTemplateKey,
  editorStateJson: string,
  margins: ProgramMargins,
  pageStyle?: LetterPageStyle | null,
): Promise<void> {
  reportSaving();
  try {
    await setDoc(doc(db, "wards", wardId, "templates", key), {
      editorStateJson,
      margins,
      pageStyle: pageStyle ?? null,
      updatedAt: serverTimestamp(),
    });
    reportSaved();
  } catch (e) {
    reportSaveError(e);
    throw e;
  }
}
