import { useRef } from "react";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import { useFitScale } from "@/hooks/useFitScale";
import { LetterCanvas, LETTER_CANVAS_HEIGHT_PX, LETTER_CANVAS_WIDTH_PX } from "./LetterCanvas";

interface Props {
  wardName: string;
  assignedDate: string;
  today: string;
  bodyMarkdown: string;
  footerMarkdown: string;
  /** CSS `height` for the outer frame. The pan/zoom wrapper fills
   *  this and clips overflow internally — no scrollbar ever shows. */
  height?: string;
}

/** Letter preview with mouse-wheel zoom + drag pan (desktop) and
 *  pinch zoom + touch pan (mobile). Initial scale is computed to
 *  fit the paper inside the container at its natural 8.5×11
 *  proportions; user can zoom in to inspect details and pan around.
 *  Text selection inside the paper is disabled so click-and-drag
 *  reads as panning, not text selection. */
export function ScaledLetterPreview({
  wardName,
  assignedDate,
  today,
  bodyMarkdown,
  footerMarkdown,
  height = "calc(100dvh - 10rem)",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const fitScale = useFitScale(ref, LETTER_CANVAS_WIDTH_PX, LETTER_CANVAS_HEIGHT_PX);
  return (
    <div className="rounded-md bg-parchment-2/40 p-4 sm:p-6" style={{ height }}>
      <div ref={ref} className="h-full w-full overflow-hidden select-none">
        {/* `key` reseeds initialScale when the container size changes
            so a window resize re-fits to the new column. */}
        <TransformWrapper
          key={`${fitScale}`}
          initialScale={fitScale}
          minScale={fitScale * 0.5}
          maxScale={4}
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
              bodyMarkdown={bodyMarkdown}
              footerMarkdown={footerMarkdown}
            />
          </TransformComponent>
        </TransformWrapper>
      </div>
    </div>
  );
}
