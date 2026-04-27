import { Link } from "react-router";
import { SaveBar } from "@/components/ui/SaveBar";
import { useMemo } from "react";
import { useFullViewportLayout } from "@/hooks/useFullViewportLayout";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { PrintOnlyLetter } from "@/features/templates/PrintOnlyLetter";
import { DesktopOnlyNotice } from "@/features/page-editor/DesktopOnlyNotice";
import { LetterPageEditor } from "@/features/page-editor/LetterPageEditor";
import { buildInitialPrayerLetterState } from "@/features/page-editor/utils/prayerLetterEditorConfig";
import {
  PRAYER_LETTER_VARIABLES,
  PRAYER_LETTER_VARIABLE_GROUP_LABEL,
  PRAYER_LETTER_VARIABLE_SAMPLES,
} from "@/features/page-editor/utils/prayerLetterVariables";
import { resolveChipsInState } from "@/features/page-editor/utils/serializeForInterpolation";
import { usePrayerLetterTemplateEditor } from "@/features/page-editor/hooks/usePrayerLetterTemplateEditor";
import { interpolate } from "@/features/templates/utils/interpolate";
import { useCurrentMember } from "@/hooks/useCurrentMember";
import { useWardSettings } from "@/hooks/useWardSettings";

const SAMPLE = {
  date: "Sunday, May 17, 2026",
  today: "April 27, 2026",
};

/** Prayer-letter template editor — same WYSIWYG framework as the
 *  speaker letter, but seeded with prayer-shaped chrome (Letterhead
 *  title "Invitation to Pray", shorter body, prayer-themed scripture
 *  footer) + prayer-specific variables (`{{prayerGiverName}}`,
 *  `{{prayerType}}`). The page header uses a brass-deep eyebrow
 *  ("Prayer · Template") so the bishop can tell at a glance whether
 *  they're editing the speaker letter or the prayer letter. */
export function PrayerLetterTemplatePage(): React.ReactElement {
  useFullViewportLayout();
  const isMobile = useIsMobile();
  const ward = useWardSettings();
  const me = useCurrentMember();
  const editor = usePrayerLetterTemplateEditor();
  const canEdit = Boolean(me?.data.active);
  const wardName = ward.data?.name ?? "";

  if (isMobile) return <DesktopOnlyNotice title="Prayer invitation letter" />;

  const printEditorStateJson = useMemo(() => {
    const liveJson = editor.stateJson ?? editor.initialJson;
    if (!liveJson) return undefined;
    const liveVars = {
      ...PRAYER_LETTER_VARIABLE_SAMPLES,
      wardName: wardName || PRAYER_LETTER_VARIABLE_SAMPLES.wardName,
    };
    return resolveChipsInState(interpolate(liveJson, liveVars), liveVars);
  }, [editor.stateJson, editor.initialJson, wardName]);

  return (
    <main className="min-h-dvh lg:h-dvh bg-parchment flex flex-col lg:overflow-hidden">
      <PrintOnlyLetter
        wardName={wardName}
        assignedDate={SAMPLE.date}
        today={SAMPLE.today}
        bodyMarkdown={editor.initialMarkdown.bodyMarkdown}
        footerMarkdown={editor.initialMarkdown.footerMarkdown}
        {...(printEditorStateJson ? { editorStateJson: printEditorStateJson } : {})}
      />
      <header className="shrink-0 border-b border-border bg-chalk px-5 sm:px-8 py-4 flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1 min-w-0">
          <Link
            to="/settings/templates"
            className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-walnut-3 hover:text-walnut"
          >
            ← Templates
          </Link>
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-brass-soft text-brass-deep text-[12px]"
            >
              ❖
            </span>
            <h1 className="font-display text-[22px] sm:text-[26px] font-semibold text-walnut leading-tight">
              Prayer invitation letter
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {editor.usingDefault && (
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-walnut-3/40 bg-parchment-2 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-walnut-3">
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

      <div className="flex-1 min-h-0 pb-16">
        {editor.seeded && (
          <LetterPageEditor
            key={editor.editorKey}
            namespace="PrayerLetterPageEditor"
            assignedDate={SAMPLE.date}
            initialJson={editor.initialJson}
            initialMarkdown={editor.initialMarkdown}
            pageStyle={editor.initialPageStyle ?? undefined}
            buildInitialState={buildInitialPrayerLetterState}
            variables={PRAYER_LETTER_VARIABLES}
            variableGroupLabels={PRAYER_LETTER_VARIABLE_GROUP_LABEL}
            variableSamples={PRAYER_LETTER_VARIABLE_SAMPLES}
            showSampleNotice
            onChange={editor.setStateJson}
            onInitial={editor.captureInitial}
            onPageStyleChange={canEdit ? editor.setPageStyle : undefined}
            ariaLabel="Prayer invitation letter"
            editorDisabled={!canEdit}
          />
        )}
      </div>

      <SaveBar
        dirty={editor.dirty && canEdit}
        saving={editor.saving}
        savedAt={editor.savedAt}
        error={editor.error}
        onDiscard={editor.discard}
        onSave={() => void editor.save()}
      />
    </main>
  );
}
