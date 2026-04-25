import { useRef, useState } from "react";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import type { ProgramTemplateKey } from "@/lib/types";
import { useFitScale } from "@/hooks/useFitScale";
import { LetterPreviewZoomControls } from "@/features/templates/LetterPreviewZoomControls";
import { PROGRAM_CANVAS_DIMS, ProgramCanvas } from "./ProgramCanvas";
import { renderProgramState } from "./programTemplateRender";

interface Props {
  variant: ProgramTemplateKey;
  /** Lexical EditorState JSON. */
  json: string;
  /** Variable map used to resolve `{{token}}` chips at preview time. */
  variables: Record<string, string>;
}

/** True 8.5 × 11 paper preview with mouse-wheel zoom + drag pan
 *  (desktop) and pinch zoom + touch pan (mobile). Initial scale is
 *  computed to fit the sheet inside the host container; the bishop
 *  can zoom in to verify margins / hymn rows / variable spacing.
 *  Reuses the same `react-zoom-pan-pinch` setup as the speaker-letter
 *  preview so the gesture vocabulary is consistent. */
export function ScaledProgramPreview({ variant, json, variables }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const dims = PROGRAM_CANVAS_DIMS[variant];
  const fitScale = useFitScale(ref, dims.w, dims.h);
  const [zoomPercent, setZoomPercent] = useState(() => Math.round(fitScale * 100));
  return (
    <div className="rounded-md border border-border bg-parchment-2/40 overflow-hidden flex-1 min-h-0">
      <div ref={ref} className="relative h-full w-full overflow-hidden select-none">
        {/* `key` reseeds initialScale when container size or variant
            changes — landscape ↔ portrait swap or window resize
            re-fits cleanly to the new dims. */}
        <TransformWrapper
          key={`${variant}-${fitScale}`}
          initialScale={fitScale}
          minScale={fitScale * 0.5}
          maxScale={4}
          centerOnInit
          limitToBounds={false}
          doubleClick={{ mode: "reset" }}
          wheel={{ step: 0.1 }}
          pinch={{ step: 5 }}
          panning={{ velocityDisabled: true }}
          onTransformed={(_, state) => setZoomPercent(Math.round(state.scale * 100))}
          onInit={(api) => setZoomPercent(Math.round(api.state.scale * 100))}
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              <TransformComponent
                wrapperStyle={{ width: "100%", height: "100%", cursor: "grab" }}
                contentStyle={{ width: dims.w, height: "auto" }}
              >
                <ProgramCanvas variant={variant}>
                  {renderProgramState(json, variables)}
                </ProgramCanvas>
              </TransformComponent>
              <LetterPreviewZoomControls
                zoomPercent={zoomPercent}
                onZoomIn={() => zoomIn()}
                onZoomOut={() => zoomOut()}
                onReset={() => resetTransform()}
              />
            </>
          )}
        </TransformWrapper>
      </div>
    </div>
  );
}
