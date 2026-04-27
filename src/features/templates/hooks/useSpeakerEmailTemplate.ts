import { speakerEmailTemplateSchema } from "@/lib/types";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import { useDocSnapshot } from "@/hooks/_sub";

/**
 * Subscribes to the ward's speaker-email body template at
 * `wards/{wardId}/templates/speakerEmail`. Returns `data: null` when
 * no template has been written yet — callers should fall back to
 * `DEFAULT_SPEAKER_EMAIL_BODY`.
 */
export function useSpeakerEmailTemplate() {
  const wardId = useCurrentWardStore((s) => s.wardId);
  return useDocSnapshot(["wards", wardId, "templates", "speakerEmail"], speakerEmailTemplateSchema);
}
