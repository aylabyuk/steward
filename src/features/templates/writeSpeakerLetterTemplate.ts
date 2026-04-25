import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { reportSaved, reportSaveError, reportSaving } from "@/stores/saveStatusStore";
import type { LetterPageStyle } from "@/lib/types/template";
import { legacyFieldsFromState } from "@/features/page-editor/serializeForInterpolation";

export interface SpeakerLetterTemplateInput {
  /** Lexical EditorState as a JSON string — the new source of truth.
   *  The writer derives `bodyMarkdown`/`footerMarkdown` from this so
   *  legacy readers (Cloud Functions, receipt emails) keep working
   *  during the ~30-day dual-write window. */
  editorStateJson: string;
  /** Optional page-frame styling (border + paper). Cleared when null. */
  pageStyle?: LetterPageStyle | null;
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
    const state = JSON.parse(input.editorStateJson);
    const { bodyMarkdown, footerMarkdown } = legacyFieldsFromState(state);
    await setDoc(doc(db, "wards", wardId, "templates", "speakerLetter"), {
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
