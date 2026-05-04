import { useEffect, useState } from "react";
import { SaveBar } from "@/components/ui/SaveBar";
import { useCurrentMember } from "@/hooks/useCurrentMember";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import { friendlyWriteError } from "@/stores/saveStatusStore";
import type { LetterPageStyle } from "@/lib/types";
import { ProgramPageEditor } from "@/features/page-editor/ProgramPageEditor";
import { DEFAULT_MARGINS } from "./ProgramCanvas";
import { useProgramTemplate } from "./hooks/useProgramTemplate";
import { defaultProgramTemplate } from "./utils/programTemplateDefaults";
import { writeProgramTemplate } from "./utils/writeProgramTemplate";

const KEY = "conductingProgram";

interface Props {
  onUsingDefaultChange?: (using: boolean) => void;
}

/** Conducting-copy template editor on /settings/templates/programs.
 *  Lexical WYSIWYG with variable chips — same authoring surface as
 *  the speaker + prayer letter editors, scoped to the ward template
 *  doc at `wards/{wardId}/templates/conductingProgram`. */
export function ConductingTemplateTab({ onUsingDefaultChange }: Props) {
  const wardId = useCurrentWardStore((s) => s.wardId);
  const me = useCurrentMember();
  const canEdit = Boolean(me?.data.active);
  const tpl = useProgramTemplate(KEY);

  const initialJson = tpl.data?.editorStateJson ?? defaultProgramTemplate(KEY);
  const usingDefault = !tpl.data?.editorStateJson;

  const [draft, setDraft] = useState<string | null>(null);
  const [pageStyleDraft, setPageStyleDraft] = useState<LetterPageStyle | null>(null);
  const [editorKey, setEditorKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    onUsingDefaultChange?.(usingDefault);
  }, [usingDefault, onUsingDefaultChange]);

  const editorJson = draft ?? initialJson;
  const activePageStyle = pageStyleDraft ?? tpl.data?.pageStyle ?? null;
  const jsonDirty = draft !== null && draft !== initialJson;
  const styleDirty =
    pageStyleDraft !== null &&
    JSON.stringify(pageStyleDraft) !== JSON.stringify(tpl.data?.pageStyle ?? null);
  const dirty = jsonDirty || styleDirty;

  async function save() {
    if (!wardId) return;
    const margins = tpl.data?.margins ?? DEFAULT_MARGINS[KEY];
    setSaving(true);
    setError(null);
    try {
      await writeProgramTemplate(wardId, KEY, draft ?? initialJson, margins, activePageStyle);
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
          showSampleNotice
          onChange={setDraft}
          onPageStyleChange={canEdit ? setPageStyleDraft : undefined}
          ariaLabel="Conducting copy"
          editorDisabled={!canEdit}
        />
      </div>

      <SaveBar
        dirty={dirty && canEdit}
        saving={saving}
        savedAt={savedAt}
        error={error}
        onDiscard={discard}
        onSave={() => void save()}
      />
    </>
  );
}
