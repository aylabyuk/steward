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

interface Props {
  variant: ProgramTemplateKey;
  /** The rendered template content — output of
   *  `renderProgramState(json, variables)`. Reused inside both
   *  congregation columns so they stay in lockstep. */
  children: React.ReactNode;
}

/** True-to-print 8.5 × 11 sheet for the program preview. Conducting
 *  copy is portrait; congregation copy is landscape with the same
 *  content rendered into two side-by-side columns separated by a
 *  cut-line, matching the existing print layout the bishop will
 *  actually see when they hit print. */
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
  return (
    <div className="bg-chalk text-walnut font-serif w-[8.5in] h-[11in] px-[0.75in] pt-[0.7in] pb-[0.55in] shadow-[0_12px_40px_rgba(58,37,25,0.18)] relative overflow-hidden">
      {children}
    </div>
  );
}
