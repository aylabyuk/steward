import { sacramentMeetingSchema, speakerSchema } from "@/lib/types";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import { useCollectionSnapshot, useDocSnapshot } from "./_sub";

export function useMeeting(date: string | null) {
  const wardId = useCurrentWardStore((s) => s.wardId);
  return useDocSnapshot(["wards", wardId, "meetings", date ?? undefined], sacramentMeetingSchema);
}

export function useSpeakers(date: string | null) {
  const wardId = useCurrentWardStore((s) => s.wardId);
  return useCollectionSnapshot(
    ["wards", wardId, "meetings", date ?? undefined, "speakers"],
    speakerSchema,
  );
}
