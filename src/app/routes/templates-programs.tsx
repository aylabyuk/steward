import { useEffect, useState } from "react";
import { Link } from "react-router";
import { SaveBar } from "@/components/ui/SaveBar";
import { useCurrentMember } from "@/hooks/useCurrentMember";
import { useFullViewportLayout } from "@/hooks/useFullViewportLayout";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import { friendlyWriteError } from "@/stores/saveStatusStore";
import type { LetterPageStyle, ProgramTemplateKey } from "@/lib/types";
import { DEFAULT_MARGINS } from "@/features/program-templates/ProgramCanvas";
import { defaultProgramTemplate } from "@/features/program-templates/programTemplateDefaults";
import { useProgramTemplate } from "@/features/program-templates/useProgramTemplate";
import { writeProgramTemplate } from "@/features/program-templates/writeProgramTemplate";
import { ProgramPageEditor } from "@/features/page-editor/ProgramPageEditor";

const TABS: { key: ProgramTemplateKey; label: string }[] = [
  { key: "conductingProgram", label: "Conducting copy" },
  { key: "congregationProgram", label: "Congregation copy" },
];

function nowLabel(): string {
  return new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

/** /settings/templates/programs — WYSIWYG editor for both program
 *  copies. The editor IS the page; chrome (eyebrow + paper frame)
 *  renders around a single contenteditable. Tab switches between
 *  conducting + congregation copies, each with its own draft state. */
export function ProgramTemplatesPage(): React.ReactElement {
  useFullViewportLayout();
  const wardId = useCurrentWardStore((s) => s.wardId);
  const me = useCurrentMember();
  const canEdit = Boolean(me?.data.active);

  const [activeKey, setActiveKey] = useState<ProgramTemplateKey>("conductingProgram");
  const conducting = useProgramTemplate("conductingProgram");
  const congregation = useProgramTemplate("congregationProgram");
  const activeDoc = activeKey === "conductingProgram" ? conducting.data : congregation.data;
  const initialJson = activeDoc?.editorStateJson ?? defaultProgramTemplate(activeKey);
  const usingDefault = !activeDoc?.editorStateJson;

  const [draft, setDraft] = useState<Record<ProgramTemplateKey, string | null>>({
    conductingProgram: null,
    congregationProgram: null,
  });
  const [pageStyleDraft, setPageStyleDraft] = useState<
    Record<ProgramTemplateKey, LetterPageStyle | null>
  >({ conductingProgram: null, congregationProgram: null });
  const [editorKey, setEditorKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  // Reset the editor's mount key whenever the active tab flips so
  // Lexical hydrates from the new tab's initial state.
  useEffect(() => {
    setEditorKey((k) => k + 1);
  }, [activeKey]);

  const editorJson = draft[activeKey] ?? initialJson;
  const activePageStyle = pageStyleDraft[activeKey] ?? activeDoc?.pageStyle ?? null;
  const jsonDirty = draft[activeKey] !== null && draft[activeKey] !== initialJson;
  const styleDirty =
    pageStyleDraft[activeKey] !== null &&
    JSON.stringify(pageStyleDraft[activeKey]) !== JSON.stringify(activeDoc?.pageStyle ?? null);
  const dirty = jsonDirty || styleDirty;

  async function save() {
    if (!wardId) return;
    const jsonToSave = draft[activeKey] ?? initialJson;
    const margins = activeDoc?.margins ?? DEFAULT_MARGINS[activeKey];
    const pageStyleToSave = activePageStyle ?? null;
    setSaving(true);
    setError(null);
    try {
      await writeProgramTemplate(wardId, activeKey, jsonToSave, margins, pageStyleToSave);
      setDraft((d) => ({ ...d, [activeKey]: null }));
      setPageStyleDraft((d) => ({ ...d, [activeKey]: null }));
      setSavedAt(nowLabel());
    } catch (e) {
      setError(friendlyWriteError(e));
    } finally {
      setSaving(false);
    }
  }

  function discard() {
    setDraft((d) => ({ ...d, [activeKey]: null }));
    setPageStyleDraft((d) => ({ ...d, [activeKey]: null }));
    setEditorKey((k) => k + 1);
    setError(null);
  }

  return (
    <main className="min-h-dvh lg:h-dvh bg-parchment flex flex-col lg:overflow-hidden">
      <header className="shrink-0 border-b border-border bg-chalk px-5 sm:px-8 py-4 flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1 min-w-0">
          <Link
            to="/schedule"
            className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-brass-deep hover:text-walnut"
          >
            ← Schedule
          </Link>
          <h1 className="font-display text-[22px] sm:text-[26px] font-semibold text-walnut leading-tight">
            Program templates
          </h1>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-walnut-3">
            Sample values shown — actual meeting / speaker values are filled in at print time.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {usingDefault && (
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-brass-soft bg-brass-soft/30 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-brass-deep">
              <span aria-hidden>★</span>
              System default — save to lock in
            </span>
          )}
          <button
            type="button"
            onClick={() => window.close()}
            className="shrink-0 rounded-md border border-border-strong bg-chalk px-3 py-1.5 font-sans text-[12.5px] font-semibold text-walnut-2 hover:bg-parchment-2"
          >
            Close
          </button>
        </div>
      </header>

      <nav className="shrink-0 flex gap-1 border-b border-border bg-parchment-2/30 px-5 sm:px-8 pt-3">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActiveKey(t.key)}
            className={
              activeKey === t.key
                ? "px-3 py-2 -mb-px border-b-2 border-bordeaux font-sans text-[13.5px] font-semibold text-walnut"
                : "px-3 py-2 -mb-px border-b-2 border-transparent font-sans text-[13.5px] text-walnut-2 hover:text-walnut"
            }
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className="flex-1 min-h-0 pb-16">
        <ProgramPageEditor
          key={`${activeKey}-${editorKey}`}
          variant={activeKey}
          initialJson={editorJson}
          pageStyle={activePageStyle}
          onChange={(json) => setDraft((d) => ({ ...d, [activeKey]: json }))}
          onPageStyleChange={
            canEdit ? (next) => setPageStyleDraft((d) => ({ ...d, [activeKey]: next })) : undefined
          }
          ariaLabel={TABS.find((t) => t.key === activeKey)!.label}
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
    </main>
  );
}
