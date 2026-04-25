import { useEffect } from "react";
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
  const result = useDocSnapshot(
    ["wards", wardId, "templates", "speakerLetter"],
    speakerLetterTemplateSchema,
  );
  useEffect(() => {
    if (result.error) {
      console.error("[wysiwyg-read] speakerLetter schema parse failed", result.error);
    } else if (!result.loading) {
      console.log("[wysiwyg-read] snapshot result", {
        hasData: !!result.data,
        keys: result.data ? Object.keys(result.data) : null,
      });
    }
  }, [result.loading, result.data, result.error]);
  return result;
}
