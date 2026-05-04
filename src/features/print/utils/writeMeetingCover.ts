import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { reportSaved, reportSaveError, reportSaving } from "@/stores/saveStatusStore";

/** Write the editable bits surfaced on the congregation prepare page
 *  — cover image URL, announcements, and program footer note — to the
 *  meeting doc. Partial update; `null` on `coverImageUrl` /
 *  `programFooterNote` clears the field. `programFooterNote === null`
 *  also reverts to the built-in default at render time. */
export async function writeMeetingCover(
  wardId: string,
  date: string,
  fields: {
    coverImageUrl: string | null;
    announcements: string;
    programFooterNote: string | null;
  },
): Promise<void> {
  reportSaving();
  try {
    await updateDoc(doc(db, "wards", wardId, "meetings", date), {
      coverImageUrl: fields.coverImageUrl ?? null,
      announcements: fields.announcements,
      programFooterNote: fields.programFooterNote ?? null,
      updatedAt: serverTimestamp(),
    });
    reportSaved();
  } catch (e) {
    reportSaveError(e);
    throw e;
  }
}
