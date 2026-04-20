import { memberSchema } from "@/lib/types";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import { useCollectionSnapshot } from "./_sub";

export function useWardMembers() {
  const wardId = useCurrentWardStore((s) => s.wardId);
  return useCollectionSnapshot(["wards", wardId, "members"], memberSchema);
}
