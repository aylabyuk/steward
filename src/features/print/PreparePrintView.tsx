import { useEffect, useState } from "react";
import { Navigate } from "react-router";
import { SaveBar } from "@/components/ui/SaveBar";
import { useMeeting } from "@/hooks/useMeeting";
import { useAuthStore } from "@/stores/authStore";
import { useFullViewportLayout } from "@/hooks/useFullViewportLayout";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import { friendlyWriteError } from "@/stores/saveStatusStore";
import { useProgramTemplate } from "@/features/program-templates/hooks/useProgramTemplate";
import { DEFAULT_MARGINS } from "@/features/program-templates/ProgramCanvas";
import { defaultProgramTemplate } from "@/features/program-templates/utils/programTemplateDefaults";
import { DesktopOnlyNotice } from "@/features/page-editor/DesktopOnlyNotice";
import { ProgramPageEditor } from "@/features/page-editor/ProgramPageEditor";
import type { LetterPageStyle, ProgramTemplateKey } from "@/lib/types";
import { PreparePrintHeader } from "./PreparePrintHeader";
import { writeMeetingProgram } from "./utils/writeMeetingProgram";

interface Props {
  date: string;
}

const TABS: { key: ProgramTemplateKey; label: string; printSegment: string }[] = [
  { key: "conductingProgram", label: "Conducting copy", printSegment: "conducting" },
  { key: "congregationProgram", label: "Congregation copy", printSegment: "congregation" },
];

/** /week/:date/prepare — per-Sunday program editor. Same WYSIWYG shell
 *  as `/settings/templates/programs`, but writes land on the meeting
 *  doc (under `programs.{conducting|congregation}`) so each Sunday
 *  carries its own saved version. The print routes prefer this
 *  override; if the bishopric never opens this page for a given week,
 *  the ward-level template is used instead. */
export function PreparePrintView({ date }: Props) {
  useFullViewportLayout();
  const isMobile = useIsMobile();
  const authed = useAuthStore((s) => s.status === "signed_in");
  const wardId = useCurrentWardStore((s) => s.wardId);
  const meeting = useMeeting(date);
  const conductingTpl = useProgramTemplate("conductingProgram");
  const congregationTpl = useProgramTemplate("congregationProgram");

  const [activeKey, setActiveKey] = useState<ProgramTemplateKey>("conductingProgram");
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

  // Re-mount Lexical when the active tab changes so it hydrates from
  // the new tab's initial state.
  useEffect(() => {
    setEditorKey((k) => k + 1);
  }, [activeKey]);

  if (!authed) return <Navigate to="/login" replace />;
  if (isMobile) return <DesktopOnlyNotice title="Prepare to print" />;

  const meetingOverride =
    activeKey === "conductingProgram"
      ? meeting.data?.programs?.conducting
      : meeting.data?.programs?.congregation;
  const wardTemplate =
    activeKey === "conductingProgram" ? conductingTpl.data : congregationTpl.data;
  const initialJson =
    meetingOverride?.editorStateJson ??
    wardTemplate?.editorStateJson ??
    defaultProgramTemplate(activeKey);
  const initialPageStyle = meetingOverride?.pageStyle ?? wardTemplate?.pageStyle ?? null;
  const margins = meetingOverride?.margins ?? wardTemplate?.margins ?? DEFAULT_MARGINS[activeKey];
  const usingOverride = Boolean(meetingOverride);

  const editorJson = draft[activeKey] ?? initialJson;
  const activePageStyle = pageStyleDraft[activeKey] ?? initialPageStyle;
  const jsonDirty = draft[activeKey] !== null && draft[activeKey] !== initialJson;
  const styleDirty =
    pageStyleDraft[activeKey] !== null &&
    JSON.stringify(pageStyleDraft[activeKey]) !== JSON.stringify(initialPageStyle);
  const dirty = jsonDirty || styleDirty;

  async function save() {
    if (!wardId) return;
    setSaving(true);
    setError(null);
    try {
      await writeMeetingProgram(
        wardId,
        date,
        activeKey,
        draft[activeKey] ?? initialJson,
        margins,
        activePageStyle ?? null,
      );
      setDraft((d) => ({ ...d, [activeKey]: null }));
      setPageStyleDraft((d) => ({ ...d, [activeKey]: null }));
      setSavedAt(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
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

  const activeTab = TABS.find((t) => t.key === activeKey)!;

  return (
    <main className="min-h-dvh lg:h-dvh bg-parchment flex flex-col lg:overflow-hidden">
      <PreparePrintHeader
        date={date}
        printSegment={activeTab.printSegment}
        usingOverride={usingOverride}
      />

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
          onPageStyleChange={(next) => setPageStyleDraft((d) => ({ ...d, [activeKey]: next }))}
          ariaLabel={activeTab.label}
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
    </main>
  );
}
