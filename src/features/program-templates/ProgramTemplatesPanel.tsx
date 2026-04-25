import { useEffect, useMemo, useRef, useState } from "react";
import type { ProgramTemplateKey } from "@/lib/types";
import { cn } from "@/lib/cn";
import { EditorResizeHandle } from "./EditorResizeHandle";
import { MobileProgramPreviewButton } from "./MobileProgramPreviewButton";
import { ProgramTemplateEditor } from "./ProgramTemplateEditor";
import { buildSampleVariables } from "./programTemplateRender";
import { ScaledProgramPreview } from "./ScaledProgramPreview";
import { SwapSidesButton } from "./SwapSidesButton";
import {
  MIN_EDITOR_WIDTH,
  MIN_PREVIEW_WIDTH,
  type PreviewSide,
  readStoredSide,
  readStoredWidth,
  writeStoredSide,
  writeStoredWidth,
} from "./panelLayoutStorage";

interface Props {
  activeKey: ProgramTemplateKey;
  description: string;
  ariaLabel: string;
  editorJson: string | null;
  canEdit: boolean;
  usingDefault: boolean;
  onChange: (json: string) => void;
}

/** Two-column body of the program-templates page: Lexical editor +
 *  sample-data preview. Bishop can drag the splitter to widen the
 *  editor and click the swap button to flip the preview to the other
 *  side. Both preferences persist in localStorage. */
export function ProgramTemplatesPanel({
  activeKey,
  description,
  ariaLabel,
  editorJson,
  canEdit,
  usingDefault,
  onChange,
}: Props) {
  const previewVars = useMemo(() => buildSampleVariables(), []);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartWidth = useRef(0);
  const [editorWidth, setEditorWidth] = useState<number>(readStoredWidth);
  const [previewSide, setPreviewSide] = useState<PreviewSide>(readStoredSide);

  useEffect(() => writeStoredWidth(editorWidth), [editorWidth]);
  useEffect(() => writeStoredSide(previewSide), [previewSide]);

  function startDrag() {
    dragStartWidth.current = editorWidth;
  }
  function onDrag(dx: number) {
    const container = containerRef.current;
    if (!container) return;
    // When the editor is on the *right* of the handle, dragging the
    // handle right makes the editor narrower — invert the delta sign.
    const signed = previewSide === "left" ? -dx : dx;
    const max = Math.max(MIN_EDITOR_WIDTH, container.clientWidth - MIN_PREVIEW_WIDTH);
    setEditorWidth(Math.max(MIN_EDITOR_WIDTH, Math.min(max, dragStartWidth.current + signed)));
  }

  const editorOrderClass = previewSide === "left" ? "lg:order-3" : "lg:order-1";
  const previewOrderClass = previewSide === "left" ? "lg:order-1" : "lg:order-3";

  return (
    <div className="flex-1 lg:min-h-0 flex flex-col px-4 sm:px-8 pt-4 pb-24 lg:overflow-hidden">
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 mb-3">
        <p className="font-serif italic text-[14px] text-walnut-2 min-w-0 flex-1">{description}</p>
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
        <div
          className={cn(
            "flex flex-col gap-2 w-full lg:h-full lg:min-h-0 lg:w-(--editor-w) lg:shrink-0",
            editorOrderClass,
          )}
          style={{ "--editor-w": `${editorWidth}px` } as React.CSSProperties}
        >
          <div className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-brass-deep font-medium">
            Editor
          </div>
          <div className="lg:flex-1 lg:min-h-0 flex flex-col">
            <ProgramTemplateEditor
              key={activeKey}
              ariaLabel={ariaLabel}
              initialStateJson={editorJson}
              onChange={onChange}
            />
            {!canEdit && (
              <p className="mt-2 font-sans text-[12px] text-walnut-3 shrink-0">
                Read-only — only active members can edit ward templates.
              </p>
            )}
          </div>
        </div>
        <EditorResizeHandle onDragStart={startDrag} onDrag={onDrag} />
        <aside
          className={cn(
            "hidden lg:flex flex-col gap-2 min-w-0 lg:h-full lg:min-h-0 lg:flex-1",
            previewOrderClass,
          )}
        >
          <div className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-brass-deep font-medium flex items-baseline justify-between">
            <span>Preview · sample data</span>
            <span className="text-walnut-3">
              {activeKey === "congregationProgram" ? "11 × 8.5 in landscape" : "8.5 × 11 in"}
            </span>
          </div>
          {editorJson ? (
            <ScaledProgramPreview variant={activeKey} json={editorJson} variables={previewVars} />
          ) : (
            <div className="rounded-lg border border-border bg-chalk p-5">
              <p className="font-serif italic text-walnut-3">
                Empty template — start typing on the left.
              </p>
            </div>
          )}
        </aside>
      </div>

      <MobileProgramPreviewButton variant={activeKey} json={editorJson} variables={previewVars} />
    </div>
  );
}
