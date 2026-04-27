import { wardInviteTemplateSchema } from "@/lib/types";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import { useDocSnapshot } from "@/hooks/_sub";

/**
 * Subscribes to the ward's member-invitation message template at
 * `wards/{wardId}/templates/wardInvite`. Returns `data: null` when no
 * template has been written yet — callers should fall back to
 * `DEFAULT_WARD_INVITE_BODY`.
 */
export function useWardInviteTemplate() {
  const wardId = useCurrentWardStore((s) => s.wardId);
  return useDocSnapshot(["wards", wardId, "templates", "wardInvite"], wardInviteTemplateSchema);
}
