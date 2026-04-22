import { useRef } from "react";
import { useFitScale } from "@/hooks/useFitScale";
import { LetterCanvas, LETTER_CANVAS_WIDTH_PX } from "./LetterCanvas";

interface Props {
  wardName: string;
  assignedDate: string;
  today: string;
  bodyMarkdown: string;
  footerMarkdown: string;
  /** CSS `max-height` applied on `lg:`. The letter sheet is ~1056 px
   *  tall so without a cap it overflows most viewports. */
  maxH?: string;
}

/** Letter preview that fits any column width without a horizontal
 *  scrollbar. Measures the outer box and applies CSS `zoom` so the
 *  paper scales down (max 1.0) to whatever width is available, while
 *  keeping true 8.5 × 11 proportions. */
export function ScaledLetterPreview({
  wardName,
  assignedDate,
  today,
  bodyMarkdown,
  footerMarkdown,
  maxH = "calc(100dvh - 10rem)",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const scale = useFitScale(ref, LETTER_CANVAS_WIDTH_PX);
  return (
    <div
      ref={ref}
      className="overflow-y-auto overflow-x-hidden rounded-md bg-parchment-2/40 p-4 sm:p-6"
      style={{ maxHeight: `var(--letter-preview-max-h, ${maxH})` }}
    >
      <div className="mx-auto w-fit" style={{ zoom: scale }}>
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
