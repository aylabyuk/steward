import { type PrayerRole, prayerParticipantSchema } from "@/lib/types";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import { useDocSnapshot } from "@/hooks/_sub";

/** Live subscription to a single prayer-participant doc.
 *  Path: `wards/{wardId}/meetings/{date}/prayers/{role}`. The doc
 *  only exists once the bishop has explicitly invited (or saved an
 *  override); the lightweight inline `meeting.openingPrayer` /
 *  `meeting.benediction` Assignment row stays the source of truth
 *  until then. */
export function usePrayerParticipant(date: string | null, role: PrayerRole) {
  const wardId = useCurrentWardStore((s) => s.wardId);
  return useDocSnapshot(
    ["wards", wardId, "meetings", date ?? undefined, "prayers", role],
    prayerParticipantSchema,
  );
}
