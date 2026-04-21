import { speakerLetterTemplateSchema } from "@/lib/types";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import { useDocSnapshot } from "@/hooks/_sub";

/**
 * Subscribes to the ward's speaker invitation letter template at
 * `wards/{wardId}/templates/speakerLetter`. Returns `data: null` when
 * no template has been written yet — callers should fall back to
 * `DEFAULT_SPEAKER_LETTER_BODY` / `_FOOTER` in that case.
 */
export function useSpeakerLetterTemplate() {
  const wardId = useCurrentWardStore((s) => s.wardId);
  return useDocSnapshot(
    ["wards", wardId, "templates", "speakerLetter"],
    speakerLetterTemplateSchema,
  );
}
