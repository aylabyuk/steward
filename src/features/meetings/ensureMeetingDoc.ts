import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { isFirstSundayOfMonth } from "@/lib/dates";
import type { MeetingType, NonMeetingSunday } from "@/lib/types";

export function defaultMeetingType(
  isoDate: string,
  nonMeetingSundays: readonly NonMeetingSunday[],
): MeetingType {
  const override = nonMeetingSundays.find((s) => s.date === isoDate);
  if (override) return override.type;
  if (isFirstSundayOfMonth(isoDate)) return "fast_sunday";
  return "regular";
}

export async function ensureMeetingDoc(
  wardId: string,
  isoDate: string,
  nonMeetingSundays: readonly NonMeetingSunday[],
): Promise<void> {
  const ref = doc(db, "wards", wardId, "meetings", isoDate);
  const snap = await getDoc(ref);
  if (snap.exists()) return;
  await setDoc(ref, {
    meetingType: defaultMeetingType(isoDate, nonMeetingSundays),
    status: "draft",
    approvals: [],
    wardBusiness: "",
    stakeBusiness: "",
    announcements: "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
