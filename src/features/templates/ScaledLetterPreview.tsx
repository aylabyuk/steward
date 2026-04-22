import { useRef } from "react";
import { useFitScale } from "@/hooks/useFitScale";
import { LetterCanvas, LETTER_CANVAS_HEIGHT_PX, LETTER_CANVAS_WIDTH_PX } from "./LetterCanvas";

interface Props {
  wardName: string;
  assignedDate: string;
  today: string;
  bodyMarkdown: string;
  footerMarkdown: string;
  /** CSS `height` for the outer frame. The scaler fills this and
   *  clips any overflow internally so no scrollbar ever shows. */
  height?: string;
}

/** Letter preview that fits any column width AND height without a
 *  scrollbar. The outer div owns the padding + background; the inner
 *  measured div (which we observe for fit-scale) has no padding, so
 *  its `clientWidth` / `clientHeight` reflect the exact usable box
 *  and the computed scale is correct to the pixel. */
export function ScaledLetterPreview({
  wardName,
  assignedDate,
  today,
  bodyMarkdown,
  footerMarkdown,
  height = "calc(100dvh - 10rem)",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const scale = useFitScale(ref, LETTER_CANVAS_WIDTH_PX, LETTER_CANVAS_HEIGHT_PX);
  return (
    <div className="rounded-md bg-parchment-2/40 p-4 sm:p-6" style={{ height }}>
      <div ref={ref} className="h-full w-full flex items-center justify-center overflow-hidden">
        <div style={{ zoom: scale }}>
          <LetterCanvas
            wardName={wardName}
            assignedDate={assignedDate}
            today={today}
            bodyMarkdown={bodyMarkdown}
            footerMarkdown={footerMarkdown}
          />
        </div>
      </div>
    </div>
  );
}
