import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { wardSettingsSchema, type WardSettings } from "@/lib/types";

export async function saveWardSettings(wardId: string, next: WardSettings): Promise<void> {
  const validated = wardSettingsSchema.parse(next);
  await updateDoc(doc(db, "wards", wardId), {
    settings: validated,
    updatedAt: serverTimestamp(),
  });
}
