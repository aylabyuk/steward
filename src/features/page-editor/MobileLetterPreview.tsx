import { useMemo, useRef } from "react";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import { useFitScale } from "@/hooks/useFitScale";
import { LETTER_CANVAS_WIDTH_PX, LetterCanvas } from "@/features/templates/LetterCanvas";
import { interpolate } from "@/features/templates/utils/interpolate";
import { resolveChipsInState } from "./utils/serializeForInterpolation";

interface Props {
  wardName: string;
  assignedDate: string;
  today: string;
  bodyMarkdown: string;
  footerMarkdown: string;
  /** Saved Lexical state. When present, the canvas renders the
   *  bishop's WYSIWYG content; chips + `{{tokens}}` are pre-resolved
   *  here so the static walker doesn't need a vars context. */
  editorStateJson?: string | null;
  /** Speaker / ward values to bake into chips + `{{tokens}}` before
   *  rendering. Omit to render the raw template content. */
  vars?: Readonly<Record<string, string>>;
  /** iOS WebView embed mode — drops the "editing is desktop-only"
   *  notice strip since there's no desktop alternative to suggest, and
   *  fills the entire parent so the host page can render edge-to-edge
   *  without surrounding chrome. */
  embed?: boolean;
}

/** Mobile, read-only letter preview. Renders the saved letter inside
 *  a single 8.5×11 paper sheet wrapped in `react-zoom-pan-pinch` so
 *  the bishop can pinch / pan / zoom on a phone. Initial scale fits
 *  the paper to the viewport width; double-tap resets, pinch zooms
 *  in to inspect details. No editor, no toolbar — the v0.12.1 walnut
 *  notice strip explains that editing is desktop-only. */
export function MobileLetterPreview({
  wardName,
  assignedDate,
  today,
  bodyMarkdown,
  footerMarkdown,
  editorStateJson,
  vars,
  embed,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fitScale = useFitScale(containerRef, LETTER_CANVAS_WIDTH_PX);

  const resolvedJson = useMemo(() => {
    if (!editorStateJson) return undefined;
    if (!vars) return editorStateJson;
    return resolveChipsInState(interpolate(editorStateJson, vars), vars);
  }, [editorStateJson, vars]);
  const renderedBody = useMemo(
    () => (vars ? interpolate(bodyMarkdown, vars) : bodyMarkdown),
    [bodyMarkdown, vars],
  );
  const renderedFooter = useMemo(
    () => (vars ? interpolate(footerMarkdown, vars) : footerMarkdown),
    [footerMarkdown, vars],
  );

  return (
    <div className="flex flex-col h-full bg-parchment">
      {!embed && (
        <div className="shrink-0 w-full bg-walnut text-chalk text-center font-mono text-[11px] uppercase tracking-[0.16em] py-2 px-4">
          Editing is desktop-only — open this on a laptop to customize this letter.
        </div>
      )}
      <div ref={containerRef} className="flex-1 min-h-0 overflow-hidden select-none">
        <TransformWrapper
          key={fitScale}
          initialScale={fitScale}
          minScale={fitScale * 0.5}
          maxScale={3}
          centerOnInit
          limitToBounds={false}
          doubleClick={{ mode: "reset" }}
          wheel={{ step: 0.1 }}
          pinch={{ step: 5 }}
          panning={{ velocityDisabled: true }}
        >
          <TransformComponent
            wrapperStyle={{ width: "100%", height: "100%", cursor: "grab" }}
            contentStyle={{ width: LETTER_CANVAS_WIDTH_PX, height: "auto" }}
          >
            <LetterCanvas
              wardName={wardName}
              assignedDate={assignedDate}
              today={today}
              bodyMarkdown={renderedBody}
              footerMarkdown={renderedFooter}
              {...(resolvedJson ? { editorStateJson: resolvedJson } : {})}
            />
          </TransformComponent>
        </TransformWrapper>
      </div>
    </div>
  );
}
