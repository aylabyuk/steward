import { prayerEmailTemplateSchema } from "@/lib/types";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import { useDocSnapshot } from "@/hooks/_sub";

/**
 * Subscribes to the ward's prayer-email body template at
 * `wards/{wardId}/templates/prayerEmail`. Returns `data: null` when
 * no template has been written yet — callers should fall back to
 * `DEFAULT_PRAYER_EMAIL_BODY`.
 */
export function usePrayerEmailTemplate() {
  const wardId = useCurrentWardStore((s) => s.wardId);
  return useDocSnapshot(["wards", wardId, "templates", "prayerEmail"], prayerEmailTemplateSchema);
}
