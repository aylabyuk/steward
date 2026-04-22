import { useRef } from "react";
import { useFitScale } from "@/hooks/useFitScale";
import { LetterCanvas, LETTER_CANVAS_HEIGHT_PX, LETTER_CANVAS_WIDTH_PX } from "./LetterCanvas";

interface Props {
  wardName: string;
  assignedDate: string;
  today: string;
  bodyMarkdown: string;
  footerMarkdown: string;
  /** CSS `height` applied on `lg:`. The preview box is given an
   *  explicit height so the fit-scale hook can constrain on both
   *  axes and the paper fits without any scrollbar. */
  height?: string;
}

/** Letter preview that fits any column width AND height without a
 *  scrollbar. Measures the outer box and applies CSS `zoom` so the
 *  paper scales down (max 1.0) to whichever dimension is more
 *  constraining, while keeping true 8.5 × 11 proportions. */
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
    <div
      ref={ref}
      className="overflow-hidden rounded-md bg-parchment-2/40 p-4 sm:p-6 flex items-start justify-center"
      style={{ height }}
    >
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
  );
}
