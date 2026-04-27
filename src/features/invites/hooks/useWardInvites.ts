import { inviteSchema } from "@/lib/types";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import { useCollectionSnapshot } from "@/hooks/_sub";

export function useWardInvites() {
  const wardId = useCurrentWardStore((s) => s.wardId);
  return useCollectionSnapshot(["wards", wardId, "invites"], inviteSchema);
}
