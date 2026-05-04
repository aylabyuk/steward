import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { LetterPageStyle, ProgramMargins, ProgramTemplateKey } from "@/lib/types";
import { reportSaved, reportSaveError, reportSaving } from "@/stores/saveStatusStore";

/** Map between the ward-template key (`conductingProgram` /
 *  `congregationProgram`) and the meeting-doc field on
 *  `meeting.programs` (`conducting` / `congregation`). The shorter
 *  meeting-side names live under `programs.*`, so they don't collide
 *  with the assignment field `meeting.conducting`. */
const MEETING_FIELD: Record<ProgramTemplateKey, "conducting" | "congregation"> = {
  conductingProgram: "conducting",
  congregationProgram: "congregation",
};

/** Write the per-Sunday program override to the meeting doc. Stored
 *  under `meeting.programs.{conducting|congregation}` so it can be
 *  loaded standalone (no extra round-trips) and the print routes can
 *  prefer it over the ward template. */
export async function writeMeetingProgram(
  wardId: string,
  date: string,
  key: ProgramTemplateKey,
  editorStateJson: string,
  margins: ProgramMargins,
  pageStyle: LetterPageStyle | null,
): Promise<void> {
  reportSaving();
  try {
    const field = MEETING_FIELD[key];
    await updateDoc(doc(db, "wards", wardId, "meetings", date), {
      [`programs.${field}`]: {
        editorStateJson,
        margins,
        pageStyle: pageStyle ?? null,
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

export function meetingProgramField(key: ProgramTemplateKey): "conducting" | "congregation" {
  return MEETING_FIELD[key];
}
