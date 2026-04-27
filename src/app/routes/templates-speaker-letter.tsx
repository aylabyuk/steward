import { Link } from "react-router";
import { SaveBar } from "@/components/ui/SaveBar";
import { useMemo } from "react";
import { useFullViewportLayout } from "@/hooks/useFullViewportLayout";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { PrintOnlyLetter } from "@/features/templates/PrintOnlyLetter";
import { DesktopOnlyNotice } from "@/features/page-editor/DesktopOnlyNotice";
import { LetterPageEditor } from "@/features/page-editor/LetterPageEditor";
import { LETTER_VARIABLE_SAMPLES } from "@/features/page-editor/letterVariables";
import { resolveChipsInState } from "@/features/page-editor/serializeForInterpolation";
import { useSpeakerLetterTemplateEditor } from "@/features/page-editor/useSpeakerLetterTemplateEditor";
import { interpolate } from "@/features/templates/interpolate";
import { useCurrentMember } from "@/hooks/useCurrentMember";
import { useWardSettings } from "@/hooks/useWardSettings";

const SAMPLE = {
  date: "Sunday, April 26, 2026",
  today: "April 21, 2026",
};

/** Speaker-letter template editor — Word-style WYSIWYG, single
 *  canvas. The editor IS the page: chrome (ornament, eyebrow, title,
 *  date) renders around the contenteditable, and the bishop authors
 *  greeting + body + assigned-Sunday callout + signature + closing
 *  scripture all in one continuous flow. SaveBar handles
 *  persist/discard/status. */
export function SpeakerLetterTemplatePage(): React.ReactElement {
  useFullViewportLayout();
  const isMobile = useIsMobile();
  const ward = useWardSettings();
  const me = useCurrentMember();
  const editor = useSpeakerLetterTemplateEditor();
  const canEdit = Boolean(me?.data.active);
  const wardName = ward.data?.name ?? "";

  if (isMobile) return <DesktopOnlyNotice title="Speaker invitation letter" />;

  // Live editor JSON, baked against sample vars (chip resolution +
  // {{token}} interpolation) so the OS print dialog renders the
  // same JSON-rendered view the bishop sees on screen — including
  // chip color, italic on the topic, the bishop's authored signatory,
  // and the letterhead text (instead of falling through to the
  // legacy chrome+markdown path which can't carry inline styling
  // through plain markdown).
  const printEditorStateJson = useMemo(() => {
    const liveJson = editor.stateJson ?? editor.initialJson;
    if (!liveJson) return undefined;
    const liveVars = {
      ...LETTER_VARIABLE_SAMPLES,
      wardName: wardName || LETTER_VARIABLE_SAMPLES.wardName,
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
            to="/schedule"
            className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-brass-deep hover:text-walnut"
          >
            ← Schedule
          </Link>
          <h1 className="font-display text-[22px] sm:text-[26px] font-semibold text-walnut leading-tight">
            Speaker invitation letter
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {editor.usingDefault && (
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

      <div className="flex-1 min-h-0 pb-16">
        {editor.seeded && (
          <LetterPageEditor
            key={editor.editorKey}
            assignedDate={SAMPLE.date}
            initialJson={editor.initialJson}
            initialMarkdown={editor.initialMarkdown}
            pageStyle={editor.initialPageStyle ?? undefined}
            showSampleNotice
            onChange={editor.setStateJson}
            onInitial={editor.captureInitial}
            onPageStyleChange={canEdit ? editor.setPageStyle : undefined}
            ariaLabel="Speaker invitation letter"
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
