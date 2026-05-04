import { useEffect, useState } from "react";
import { SaveBar } from "@/components/ui/SaveBar";
import { useMeeting } from "@/hooks/useMeeting";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import { friendlyWriteError } from "@/stores/saveStatusStore";
import { useProgramTemplate } from "@/features/program-templates/hooks/useProgramTemplate";
import { DEFAULT_MARGINS } from "@/features/program-templates/ProgramCanvas";
import { defaultProgramTemplate } from "@/features/program-templates/utils/programTemplateDefaults";
import { ProgramPageEditor } from "@/features/page-editor/ProgramPageEditor";
import type { LetterPageStyle } from "@/lib/types";
import { writeMeetingProgram } from "./utils/writeMeetingProgram";

interface Props {
  date: string;
  onUsingOverrideChange?: (using: boolean) => void;
}

const KEY = "conductingProgram";

/** Conducting tab on /week/:date/prepare. WYSIWYG Lexical editor with
 *  per-Sunday save under `meeting.programs.conducting`. Initial state
 *  cascades: per-Sunday saved → ward template → built-in default. */
export function ConductingPrepareTab({ date, onUsingOverrideChange }: Props) {
  const wardId = useCurrentWardStore((s) => s.wardId);
  const meeting = useMeeting(date);
  const tpl = useProgramTemplate(KEY);

  const [draft, setDraft] = useState<string | null>(null);
  const [pageStyleDraft, setPageStyleDraft] = useState<LetterPageStyle | null>(null);
  const [editorKey, setEditorKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const override = meeting.data?.programs?.conducting;
  const initialJson =
    override?.editorStateJson ?? tpl.data?.editorStateJson ?? defaultProgramTemplate(KEY);
  const initialPageStyle = override?.pageStyle ?? tpl.data?.pageStyle ?? null;
  const margins = override?.margins ?? tpl.data?.margins ?? DEFAULT_MARGINS[KEY];

  useEffect(() => {
    onUsingOverrideChange?.(Boolean(override));
  }, [override, onUsingOverrideChange]);

  const editorJson = draft ?? initialJson;
  const activePageStyle = pageStyleDraft ?? initialPageStyle;
  const jsonDirty = draft !== null && draft !== initialJson;
  const styleDirty =
    pageStyleDraft !== null && JSON.stringify(pageStyleDraft) !== JSON.stringify(initialPageStyle);
  const dirty = jsonDirty || styleDirty;

  async function save() {
    if (!wardId) return;
    setSaving(true);
    setError(null);
    try {
      await writeMeetingProgram(wardId, date, KEY, draft ?? initialJson, margins, activePageStyle);
      setDraft(null);
      setPageStyleDraft(null);
      setSavedAt(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
    } catch (e) {
      setError(friendlyWriteError(e));
    } finally {
      setSaving(false);
    }
  }

  function discard() {
    setDraft(null);
    setPageStyleDraft(null);
    setEditorKey((k) => k + 1);
    setError(null);
  }

  return (
    <>
      <div className="flex-1 min-h-0 pb-16">
        <ProgramPageEditor
          key={`conducting-${editorKey}`}
          variant={KEY}
          initialJson={editorJson}
          pageStyle={activePageStyle}
          onChange={setDraft}
          onPageStyleChange={setPageStyleDraft}
          ariaLabel="Conducting copy"
        />
      </div>
      <SaveBar
        dirty={dirty}
        saving={saving}
        savedAt={savedAt}
        error={error}
        onDiscard={discard}
        onSave={() => void save()}
      />
    </>
  );
}
