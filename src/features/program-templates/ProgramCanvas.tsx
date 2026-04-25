import { useLayoutEffect, useRef, useState } from "react";
import type { ProgramMargins, ProgramTemplateKey } from "@/lib/types";

/** Natural dimensions of each program-print variant in CSS pixels.
 *  8.5 in × 96 dpi = 816 px; 11 in = 1056 px. */
export const PROGRAM_CANVAS_DIMS: Record<
  ProgramTemplateKey,
  { w: number; h: number; landscape: boolean }
> = {
  conductingProgram: { w: 816, h: 1056, landscape: false },
  congregationProgram: { w: 1056, h: 816, landscape: true },
};

const DPI = 96;

export const DEFAULT_MARGINS: Record<ProgramTemplateKey, ProgramMargins> = {
  conductingProgram: { top: 0.7, right: 0.75, bottom: 0.55, left: 0.75 },
  congregationProgram: { top: 0.55, right: 0.45, bottom: 0.4, left: 0.45 },
};

interface Props {
  variant: ProgramTemplateKey;
  /** Page margins in inches. Falls back to variant default. */
  margins?: ProgramMargins;
  /** Rendered template content — output of `renderProgramState(...)`. */
  children: React.ReactNode;
}

/** True-to-print 8.5 × 11 sheet(s) for the program preview.
 *  Conducting copy paginates automatically when content overflows
 *  the per-page content box; each page clips at the content edge so
 *  rendered content never bleeds into the bottom margin.
 *  Congregation copy stays a single landscape sheet split into two
 *  cut-down-the-middle columns. */
export function ProgramCanvas({ variant, margins, children }: Props) {
  const m = margins ?? DEFAULT_MARGINS[variant];
  if (variant === "congregationProgram")
    return <CongregationSheet margins={m}>{children}</CongregationSheet>;
  return <ConductingMultiPage margins={m}>{children}</ConductingMultiPage>;
}

function CongregationSheet({
  margins,
  children,
}: {
  margins: ProgramMargins;
  children: React.ReactNode;
}) {
  const pad = `${margins.top}in ${margins.right}in ${margins.bottom}in ${margins.left}in`;
  return (
    <div className="bg-chalk text-walnut font-serif w-[11in] h-[8.5in] shadow-[0_12px_40px_rgba(58,37,25,0.18)] relative overflow-hidden">
      <div className="grid grid-cols-2 h-full">
        <div className="overflow-hidden" style={{ padding: pad }}>
          {children}
        </div>
        <div
          className="overflow-hidden border-l border-dashed border-walnut-3/70"
          style={{ padding: pad }}
        >
          {children}
        </div>
      </div>
      <p className="absolute inset-x-0 bottom-1.5 text-center font-serif italic text-[10px] text-walnut-3 pointer-events-none">
        Two copies per page — cut down the middle.
      </p>
    </div>
  );
}

function ConductingMultiPage({
  margins,
  children,
}: {
  margins: ProgramMargins;
  children: React.ReactNode;
}) {
  const measureRef = useRef<HTMLDivElement>(null);
  const [pageCount, setPageCount] = useState(1);

  const pageW = PROGRAM_CANVAS_DIMS.conductingProgram.w;
  const pageH = PROGRAM_CANVAS_DIMS.conductingProgram.h;
  const contentW = pageW - (margins.left + margins.right) * DPI;
  const contentH = pageH - (margins.top + margins.bottom) * DPI;

  useLayoutEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    const update = () => {
      const next = Math.max(1, Math.ceil(el.scrollHeight / contentH));
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
        style={{ width: contentW }}
      >
        {children}
      </div>
      {Array.from({ length: pageCount }).map((_, i) => (
        <ConductingPage
          // biome-ignore lint/suspicious/noArrayIndexKey: page index IS the identity
          key={i}
          pageIndex={i}
          pageCount={pageCount}
          margins={margins}
          contentH={contentH}
        >
          {children}
        </ConductingPage>
      ))}
    </div>
  );
}

interface PageProps {
  pageIndex: number;
  pageCount: number;
  margins: ProgramMargins;
  contentH: number;
  children: React.ReactNode;
}

function ConductingPage({ pageIndex, pageCount, margins, contentH, children }: PageProps) {
  const pad = `${margins.top}in ${margins.right}in ${margins.bottom}in ${margins.left}in`;
  return (
    <div
      className="bg-chalk text-walnut font-serif w-[8.5in] h-[11in] shadow-[0_12px_40px_rgba(58,37,25,0.18)] relative overflow-hidden"
      style={{ padding: pad }}
    >
      {/* Inner clip enforces the content-box edge so rendered content
          can't bleed into the bottom margin region. */}
      <div className="overflow-hidden" style={{ height: contentH }}>
        <div style={{ transform: `translateY(${-pageIndex * contentH}px)`, width: "100%" }}>
          {children}
        </div>
      </div>
      {pageCount > 1 && (
        <div
          className="absolute font-mono text-[9px] uppercase tracking-[0.16em] text-walnut-3 pointer-events-none"
          style={{ bottom: `${margins.bottom * 0.4}in`, right: `${margins.right}in` }}
        >
          Page {pageIndex + 1} of {pageCount}
        </div>
      )}
    </div>
  );
}
