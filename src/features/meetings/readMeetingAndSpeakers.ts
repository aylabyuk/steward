import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import type { WithId } from "@/hooks/_sub";
import { db } from "@/lib/firebase";
import {
  sacramentMeetingSchema,
  type SacramentMeeting,
  speakerSchema,
  type Speaker,
} from "@/lib/types";

export async function readMeetingAndSpeakers(
  wardId: string,
  date: string,
): Promise<{ meeting: SacramentMeeting; speakers: WithId<Speaker>[] } | null> {
  const mSnap = await getDoc(doc(db, "wards", wardId, "meetings", date));
  if (!mSnap.exists()) return null;
  const mParsed = sacramentMeetingSchema.safeParse(mSnap.data());
  if (!mParsed.success) return null;

  const sSnap = await getDocs(collection(db, "wards", wardId, "meetings", date, "speakers"));
  const speakers: WithId<Speaker>[] = [];
  for (const d of sSnap.docs) {
    const parsed = speakerSchema.safeParse(d.data());
    if (parsed.success) speakers.push({ id: d.id, data: parsed.data });
  }
  return { meeting: mParsed.data, speakers };
}
