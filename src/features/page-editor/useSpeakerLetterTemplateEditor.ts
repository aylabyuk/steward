import { useEffect, useMemo, useState } from "react";
import { useSpeakerLetterTemplate } from "@/features/templates/useSpeakerLetterTemplate";
import { writeSpeakerLetterTemplate } from "@/features/templates/writeSpeakerLetterTemplate";
import {
  DEFAULT_SPEAKER_LETTER_BODY,
  DEFAULT_SPEAKER_LETTER_FOOTER,
} from "@/features/templates/speakerLetterDefaults";
import { friendlyWriteError } from "@/stores/saveStatusStore";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import type { LetterPageStyle } from "@/lib/types/template";

function nowLabel(): string {
  return new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

/** Hook owning the WYSIWYG speaker-letter template editor's state +
 *  dual-write persistence. Surfaces seed-from-legacy markdown +
 *  editor-state-JSON dirty tracking + save / discard handlers, so the
 *  route component stays inside the 150-LOC cap. */
export function useSpeakerLetterTemplateEditor() {
  const wardId = useCurrentWardStore((s) => s.wardId);
  const { data: template, loading } = useSpeakerLetterTemplate();

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
      bodyMarkdown: template?.bodyMarkdown ?? DEFAULT_SPEAKER_LETTER_BODY,
      footerMarkdown: template?.footerMarkdown ?? DEFAULT_SPEAKER_LETTER_FOOTER,
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
      await writeSpeakerLetterTemplate(wardId, {
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

  /** Called by `PageEditorComposer` once on mount with the hydrated
   *  state. Seeds both `stateJson` and `savedJson` so dirty starts at
   *  false and `save()` always has content to write — even when the
   *  bishop only edits page-style. */
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
    /** Live editor JSON — reflects the current canvas content as the
     *  bishop types. Exposed so the route can pipe it into
     *  PrintOnlyLetter (so the print preview matches what's on
     *  screen). null until the editor mounts and captureInitial
     *  fires. */
    stateJson,
    setStateJson,
    setPageStyle,
    captureInitial,
    save,
    discard,
  };
}
