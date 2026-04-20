import { wardSchema } from "@/lib/types";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import { useDocSnapshot } from "./_sub";

export function useWardSettings() {
  const wardId = useCurrentWardStore((s) => s.wardId);
  return useDocSnapshot(["wards", wardId], wardSchema);
}
