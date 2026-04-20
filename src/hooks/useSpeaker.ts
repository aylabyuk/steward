import { speakerSchema } from "@/lib/types";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import { useDocSnapshot } from "./_sub";

export function useSpeaker(date: string | null, speakerId: string | null) {
  const wardId = useCurrentWardStore((s) => s.wardId);
  return useDocSnapshot(
    ["wards", wardId, "meetings", date ?? undefined, "speakers", speakerId ?? undefined],
    speakerSchema,
  );
}
