import { upsertPrayerParticipant } from "@/features/prayers/utils/prayerActions";
import type { NonMeetingSunday, PrayerRole } from "@/lib/types";

export interface AssignPrayerInput {
  wardId: string;
  date: string;
  role: PrayerRole;
  nonMeetingSundays: readonly NonMeetingSunday[];
  name: string;
  email: string;
  phone: string;
}

/** Persist the prayer participant doc + mirror name onto the inline
 *  meeting assignment. Wraps `upsertPrayerParticipant` for the
 *  per-row Assign + Invite flow. The participant doc is created on
 *  first save (setDoc merge), and the inline `meeting.openingPrayer`
 *  / `meeting.benediction` row mirrors the name so the printed
 *  program template stays in sync. */
export async function persistAssignPrayer(input: AssignPrayerInput): Promise<void> {
  await upsertPrayerParticipant(input.wardId, input.date, input.role, {
    name: input.name.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    nonMeetingSundays: input.nonMeetingSundays,
  });
}
