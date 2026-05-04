import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { reportSaved, reportSaveError, reportSaving } from "@/stores/saveStatusStore";

/** Write the ward-level defaults that drive the congregation print
 *  bulletin when no per-meeting override is set: cover image URL and
 *  program footer note. Configurable from /settings/templates/programs.
 *  Stored under `wards/{wardId}.congregationDefaults`.
 *
 *  `null` clears the field — at render time, an absent value falls
 *  through to the next layer (built-in default for the footer; no
 *  image for the cover). */
export async function writeWardCongregationDefaults(
  wardId: string,
  fields: { coverImageUrl: string | null; programFooterNote: string | null },
): Promise<void> {
  reportSaving();
  try {
    await updateDoc(doc(db, "wards", wardId), {
      "congregationDefaults.coverImageUrl": fields.coverImageUrl ?? null,
      "congregationDefaults.programFooterNote": fields.programFooterNote ?? null,
      updatedAt: serverTimestamp(),
    });
    reportSaved();
  } catch (e) {
    reportSaveError(e);
    throw e;
  }
}
