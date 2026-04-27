import { useMemo } from "react";
import type { PrayerParticipant } from "@/lib/types";
import type { WithId } from "@/hooks/_sub";
import { usePrayerParticipant } from "@/features/prayers/hooks/usePrayerParticipant";

/** Convenience hook that subscribes to both prayer participant docs
 *  (opening + benediction) and returns them as a list shaped like
 *  `useSpeakers(date).data` so the wizard's invitation step can
 *  iterate over them with parity to the speaker flow. */
export function usePrayerParticipants(date: string) {
  const opening = usePrayerParticipant(date, "opening");
  const benediction = usePrayerParticipant(date, "benediction");
  const data = useMemo<WithId<PrayerParticipant>[]>(() => {
    const list: WithId<PrayerParticipant>[] = [];
    if (opening.data) list.push({ id: "opening", data: opening.data });
    if (benediction.data) list.push({ id: "benediction", data: benediction.data });
    return list;
  }, [opening.data, benediction.data]);
  return { data, loading: opening.loading || benediction.loading };
}
