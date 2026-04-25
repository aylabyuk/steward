import { useLayoutEffect, useRef, useState } from "react";
import type { ProgramTemplateKey } from "@/lib/types";

/** Natural dimensions of each program-print variant in CSS pixels.
 *  8.5 in × 96 dpi = 816 px; 11 in = 1056 px. The conducting copy is
 *  portrait, the congregation copy is landscape with two columns
 *  (cut down the middle, same content in each — matches the existing
 *  `CongregationProgram.tsx` print layout). */
export const PROGRAM_CANVAS_DIMS: Record<
  ProgramTemplateKey,
  { w: number; h: number; landscape: boolean }
> = {
  conductingProgram: { w: 816, h: 1056, landscape: false },
  congregationProgram: { w: 1056, h: 816, landscape: true },
};

// Conducting page metrics: 8.5 × 11 in @ 96 dpi with 0.75 in horizontal
// padding, 0.7 in top, 0.55 in bottom. Content area (where the
// rendered template flows) is therefore ≈ 7 × 9.75 in.
const PORTRAIT_CONTENT_WIDTH_PX = 816 - 0.75 * 96 * 2;
const PORTRAIT_CONTENT_HEIGHT_PX = 1056 - (0.7 + 0.55) * 96;

interface Props {
  variant: ProgramTemplateKey;
  /** The rendered template content — output of
   *  `renderProgramState(json, variables)`. Reused inside both
   *  congregation columns so they stay in lockstep. */
  children: React.ReactNode;
}

/** True-to-print 8.5 × 11 sheet(s) for the program preview.
 *  Conducting copy paginates automatically when the rendered content
 *  exceeds one page (an off-screen measurer reports the natural
 *  height; we render N stacked pages and slide the same content tree
 *  up by `-i × pageContentHeight` inside each page's clipped content
 *  box). Congregation copy stays a single landscape sheet split into
 *  two cut-down-the-middle columns — the existing print layout. */
export function ProgramCanvas({ variant, children }: Props) {
  if (variant === "congregationProgram") {
    return (
      <div className="bg-chalk text-walnut font-serif w-[11in] h-[8.5in] shadow-[0_12px_40px_rgba(58,37,25,0.18)] relative overflow-hidden">
        <div className="grid grid-cols-2 h-full">
          <div className="px-[0.45in] pt-[0.55in] pb-[0.4in] overflow-hidden">{children}</div>
          <div className="px-[0.45in] pt-[0.55in] pb-[0.4in] overflow-hidden border-l border-dashed border-walnut-3/70">
            {children}
          </div>
        </div>
        <p className="absolute inset-x-0 bottom-1.5 text-center font-serif italic text-[10px] text-walnut-3 pointer-events-none">
          Two copies per page — cut down the middle.
        </p>
      </div>
    );
  }
  return <ConductingMultiPage>{children}</ConductingMultiPage>;
}

function ConductingMultiPage({ children }: { children: React.ReactNode }) {
  const measureRef = useRef<HTMLDivElement>(null);
  const [pageCount, setPageCount] = useState(1);

  useLayoutEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    const update = () => {
      const next = Math.max(1, Math.ceil(el.scrollHeight / PORTRAIT_CONTENT_HEIGHT_PX));
      setPageCount((prev) => (prev === next ? prev : next));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  });

  return (
    <div className="flex flex-col gap-6">
      <div
        ref={measureRef}
        aria-hidden
        className="absolute -top-[10000px] left-0 pointer-events-none"
        style={{ width: PORTRAIT_CONTENT_WIDTH_PX }}
      >
        {children}
      </div>
      {Array.from({ length: pageCount }).map((_, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: page number IS the identity here
          key={i}
          className="bg-chalk text-walnut font-serif w-[8.5in] h-[11in] px-[0.75in] pt-[0.7in] pb-[0.55in] shadow-[0_12px_40px_rgba(58,37,25,0.18)] relative overflow-hidden"
        >
          <div
            style={{
              transform: `translateY(${-i * PORTRAIT_CONTENT_HEIGHT_PX}px)`,
              width: "100%",
            }}
          >
            {children}
          </div>
          {pageCount > 1 && (
            <div className="absolute bottom-3 right-[0.75in] font-mono text-[9px] uppercase tracking-[0.16em] text-walnut-3 pointer-events-none">
              Page {i + 1} of {pageCount}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
