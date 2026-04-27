import { prayerLetterTemplateSchema } from "@/lib/types";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import { useDocSnapshot } from "@/hooks/_sub";

/** Subscribes to the ward's prayer invitation letter template at
 *  `wards/{wardId}/templates/prayerLetter`. Returns `data: null`
 *  until a template has been authored — callers fall back to
 *  `DEFAULT_PRAYER_LETTER_BODY` / `_FOOTER` in that case. */
export function usePrayerLetterTemplate() {
  const wardId = useCurrentWardStore((s) => s.wardId);
  return useDocSnapshot(["wards", wardId, "templates", "prayerLetter"], prayerLetterTemplateSchema);
}
