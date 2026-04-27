import { useEffect, useMemo, useState } from "react";
import { usePrayerLetterTemplate } from "@/features/templates/usePrayerLetterTemplate";
import { writePrayerLetterTemplate } from "@/features/templates/writePrayerLetterTemplate";
import {
  DEFAULT_PRAYER_LETTER_BODY,
  DEFAULT_PRAYER_LETTER_FOOTER,
} from "@/features/templates/prayerLetterDefaults";
import { friendlyWriteError } from "@/stores/saveStatusStore";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import type { LetterPageStyle } from "@/lib/types/template";

function nowLabel(): string {
  return new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

/** Mirror of `useSpeakerLetterTemplateEditor` for the prayer letter
 *  template. Same dirty-tracking + dual-write semantics; targets the
 *  separate `wards/{wardId}/templates/prayerLetter` doc. */
export function usePrayerLetterTemplateEditor() {
  const wardId = useCurrentWardStore((s) => s.wardId);
  const { data: template, loading } = usePrayerLetterTemplate();

  const [stateJson, setStateJson] = useState<string | null>(null);
  const [savedJson, setSavedJson] = useState<string | null>(null);
  const [pageStyle, setPageStyle] = useState<LetterPageStyle | null>(null);
  const [savedPageStyle, setSavedPageStyle] = useState<LetterPageStyle | null>(null);
  const [seeded, setSeeded] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const [usingDefault, setUsingDefault] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const initialMarkdown = useMemo(
    () => ({
      bodyMarkdown: template?.bodyMarkdown ?? DEFAULT_PRAYER_LETTER_BODY,
      footerMarkdown: template?.footerMarkdown ?? DEFAULT_PRAYER_LETTER_FOOTER,
    }),
    [template?.bodyMarkdown, template?.footerMarkdown],
  );
  const initialJson = template?.editorStateJson ?? null;
  const initialPageStyle = template?.pageStyle ?? null;

  useEffect(() => {
    if (loading || seeded) return;
    setSavedJson(initialJson);
    setStateJson(initialJson);
    setSavedPageStyle(initialPageStyle);
    setPageStyle(initialPageStyle);
    setUsingDefault(!template);
    setSeeded(true);
  }, [loading, seeded, template, initialJson, initialPageStyle]);

  const dirty =
    (stateJson !== savedJson && stateJson !== null) ||
    JSON.stringify(pageStyle) !== JSON.stringify(savedPageStyle);

  async function save() {
    if (!wardId || !stateJson) return;
    setSaving(true);
    setError(null);
    try {
      await writePrayerLetterTemplate(wardId, {
        editorStateJson: stateJson,
        pageStyle: pageStyle ?? undefined,
      });
      setSavedJson(stateJson);
      setSavedPageStyle(pageStyle);
      setUsingDefault(false);
      setSavedAt(nowLabel());
    } catch (e) {
      setError(friendlyWriteError(e));
    } finally {
      setSaving(false);
    }
  }

  function discard() {
    setStateJson(savedJson);
    setPageStyle(savedPageStyle);
    setEditorKey((k) => k + 1);
    setError(null);
  }

  function captureInitial(json: string) {
    setStateJson(json);
    setSavedJson(json);
  }

  return {
    seeded,
    dirty,
    saving,
    error,
    savedAt,
    usingDefault,
    initialJson,
    initialPageStyle: pageStyle,
    initialMarkdown,
    editorKey,
    stateJson,
    setStateJson,
    setPageStyle,
    captureInitial,
    save,
    discard,
  };
}
