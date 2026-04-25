import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { EditorResizeHandle } from "@/features/program-templates/EditorResizeHandle";
import { SwapSidesButton } from "@/features/program-templates/SwapSidesButton";
import {
  MIN_EDITOR_WIDTH,
  MIN_PREVIEW_WIDTH,
  type PreviewSide,
  readStoredSide,
  readStoredWidth,
  writeStoredSide,
  writeStoredWidth,
} from "@/features/program-templates/panelLayoutStorage";
import { MobileLetterPreviewButton } from "@/features/templates/MobileLetterPreviewButton";
import { ScaledLetterPreview } from "@/features/templates/ScaledLetterPreview";
import { SpeakerLetterEditorColumn } from "./SpeakerLetterEditorColumn";

const NAMESPACE = "speakerLetterTemplate";

interface Props {
  wardName: string;
  sampleDate: string;
  sampleToday: string;
  body: string;
  footer: string;
  /** Markdown after `{{token}}` interpolation against sample vars —
   *  fed into the preview canvas so the bishop sees real names. */
  renderedBody: string;
  renderedFooter: string;
  canEdit: boolean;
  usingDefault: boolean;
  resetKey: number;
  onBodyChange: (md: string) => void;
  onFooterChange: (md: string) => void;
}

/** Editor + preview body for the speaker-letter template page.
 *  Mirrors `ProgramTemplatesPanel` — Lexical editor on one side,
 *  pan/zoom 8.5×11 preview on the other, with a draggable splitter
 *  and a swap-sides button. The footer is rendered as a small
 *  italic textarea below the body editor since it's typically a
 *  single-line scripture. */
export function SpeakerLetterPanel({
  wardName,
  sampleDate,
  sampleToday,
  body,
  footer,
  renderedBody,
  renderedFooter,
  canEdit,
  usingDefault,
  resetKey,
  onBodyChange,
  onFooterChange,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartWidth = useRef(0);
  const [editorWidth, setEditorWidth] = useState(() => readStoredWidth(NAMESPACE));
  const [previewSide, setPreviewSide] = useState<PreviewSide>(() => readStoredSide(NAMESPACE));

  useEffect(() => writeStoredWidth(NAMESPACE, editorWidth), [editorWidth]);
  useEffect(() => writeStoredSide(NAMESPACE, previewSide), [previewSide]);

  function startDrag() {
    dragStartWidth.current = editorWidth;
  }
  function onDrag(dx: number) {
    const container = containerRef.current;
    if (!container) return;
    const signed = previewSide === "left" ? -dx : dx;
    const max = Math.max(MIN_EDITOR_WIDTH, container.clientWidth - MIN_PREVIEW_WIDTH);
    setEditorWidth(Math.max(MIN_EDITOR_WIDTH, Math.min(max, dragStartWidth.current + signed)));
  }

  const editorOrderClass = previewSide === "left" ? "lg:order-3" : "lg:order-1";
  const previewOrderClass = previewSide === "left" ? "lg:order-1" : "lg:order-3";

  return (
    <div className="flex-1 lg:min-h-0 flex flex-col px-4 sm:px-8 pt-4 pb-24 lg:overflow-hidden">
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 mb-3">
        <p className="font-serif italic text-[14px] text-walnut-2 min-w-0 flex-1">
          The body + footer of the printed invitation. Variables resolve at send time so each
          speaker sees their own name, topic, and Sunday.
        </p>
        <div className="flex items-center gap-2 shrink-0">
          {usingDefault && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brass-soft bg-brass-soft/30 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-brass-deep">
              <span aria-hidden>★</span>
              System default — save to lock in
            </span>
          )}
          <SwapSidesButton
            previewSide={previewSide}
            onClick={() => setPreviewSide((s) => (s === "left" ? "right" : "left"))}
          />
        </div>
      </div>
      <div
        ref={containerRef}
        className="flex flex-col gap-6 lg:flex-row lg:gap-0 lg:flex-1 lg:min-h-0"
      >
        <SpeakerLetterEditorColumn
          className={editorOrderClass}
          body={body}
          footer={footer}
          resetKey={resetKey}
          canEdit={canEdit}
          editorWidth={editorWidth}
          onBodyChange={onBodyChange}
          onFooterChange={onFooterChange}
        />
        <EditorResizeHandle onDragStart={startDrag} onDrag={onDrag} />
        <aside
          className={cn(
            "hidden lg:flex flex-col gap-2 min-w-0 lg:h-full lg:min-h-0 lg:flex-1",
            previewOrderClass,
          )}
        >
          <div className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-brass-deep font-medium flex items-baseline justify-between">
            <span>Preview · sample data</span>
            <span className="text-walnut-3">8.5 × 11 in</span>
          </div>
          <div className="flex-1 min-h-0">
            <ScaledLetterPreview
              wardName={wardName}
              assignedDate={sampleDate}
              today={sampleToday}
              bodyMarkdown={renderedBody}
              footerMarkdown={renderedFooter}
              height="100%"
            />
          </div>
        </aside>
      </div>

      <MobileLetterPreviewButton
        wardName={wardName}
        assignedDate={sampleDate}
        today={sampleToday}
        bodyMarkdown={renderedBody}
        footerMarkdown={renderedFooter}
      />
    </div>
  );
}
