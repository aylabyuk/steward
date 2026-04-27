import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { reportSaved, reportSaveError, reportSaving } from "@/stores/saveStatusStore";
import type { LetterPageStyle } from "@/lib/types/template";
import { legacyFieldsFromState } from "@/features/page-editor/serializeForInterpolation";

export interface PrayerLetterTemplateInput {
  /** Lexical EditorState as a JSON string — the new source of truth.
   *  The writer derives `bodyMarkdown`/`footerMarkdown` from this so
   *  legacy readers (Cloud Function, receipt emails) keep working
   *  during the dual-write window. */
  editorStateJson: string;
  /** Optional page-frame styling (border + paper). Cleared when null. */
  pageStyle?: LetterPageStyle | null;
}

/** Write the prayer invitation letter template for a ward. Same trust
 *  boundary as the speaker letter — any active bishopric/clerk member
 *  can edit; non-members locked out by the `templates/{templateId}`
 *  Firestore rule. */
export async function writePrayerLetterTemplate(
  wardId: string,
  input: PrayerLetterTemplateInput,
): Promise<void> {
  reportSaving();
  try {
    const state = JSON.parse(input.editorStateJson);
    const { bodyMarkdown, footerMarkdown } = legacyFieldsFromState(state);
    await setDoc(doc(db, "wards", wardId, "templates", "prayerLetter"), {
      editorStateJson: input.editorStateJson,
      pageStyle: input.pageStyle ?? null,
      bodyMarkdown,
      footerMarkdown,
      updatedAt: serverTimestamp(),
    });
    reportSaved();
  } catch (e) {
    reportSaveError(e);
    throw e;
  }
}
