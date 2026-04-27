import { useEffect, useRef } from "react";
import { MARGIN_PRESET_INCHES, PAGE_SIZE_INCHES, type LetterPageStyle } from "@/lib/types/template";
import { PageSheet } from "./PageSheet";
import { usePagination } from "./hooks/usePagination";

const DPI = 96; // CSS px per CSS inch (browser default)
const PAGE_GAP_PX = 24; // visual gap between stacked sheets

interface Props {
  variant: "letter" | "conducting" | "congregation";
  pageStyle?: LetterPageStyle;
  zoom: number;
  /** Wheel-with-Ctrl/Cmd zoom callback. Omit to disable wheel-zoom
   *  (e.g. when the host has a fit-mode that should re-apply on
   *  resize instead). */
  onZoomChange?: (next: number) => void;
  /** Optional ref the host can read to compute fit-to-width / fit-to-
   *  page zoom values against the visible scroll area. */
  scrollRef?: React.MutableRefObject<HTMLDivElement | null>;
  /** The Lexical contenteditable subtree (already wrapped in any
   *  font / leading styling the editor wants). */
  children: React.ReactNode;
}

/** Word-style stage with strict page bounds. Renders N stacked
 *  paper sheets behind a single contenteditable layer; the
 *  pagination hook injects `margin-top` on blocks that would cross
 *  a page boundary so they jump to the next page's top margin
 *  instead of overflowing. */
export function PaginatedPageStage({
  variant,
  pageStyle,
  zoom,
  onZoomChange,
  scrollRef,
  children,
}: Props) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const size = PAGE_SIZE_INCHES[pageStyle?.pageSize ?? "letter"];
  const landscape = (pageStyle?.orientation ?? "portrait") === "landscape";
  const widthIn = landscape ? size.height : size.width;
  const heightIn = landscape ? size.width : size.height;
  const margins = MARGIN_PRESET_INCHES[pageStyle?.margins ?? "normal"];
  const padHIn = margins.horizontal;
  const padTopIn = variant === "letter" ? margins.vertical + 0.1 : margins.vertical;
  const padBottomIn = margins.vertical;

  const pageH = heightIn * DPI;
  const pageStride = pageH + PAGE_GAP_PX;
  const padTopPx = padTopIn * DPI;
  const pageContentH = (heightIn - padTopIn - padBottomIn) * DPI;

  const pages = usePagination({ pageStride, pageContentH, padTopPx, contentRef });

  useEffect(() => {
    if (!onZoomChange) return;
    const el = stageRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const step = e.deltaY < 0 ? 0.1 : -0.1;
      onZoomChange(Math.max(0.4, Math.min(2.5, +(zoom + step).toFixed(2))));
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [zoom, onZoomChange]);

  const totalH = pages * pageH + (pages - 1) * PAGE_GAP_PX;

  return (
    <div
      ref={(node) => {
        stageRef.current = node;
        if (scrollRef) scrollRef.current = node;
      }}
      className="h-full w-full overflow-auto bg-parchment py-8"
    >
      <div className="mx-auto" style={{ zoom, width: "fit-content" }}>
        <div style={{ position: "relative", width: `${widthIn}in`, height: totalH }}>
          {Array.from({ length: pages }, (_, i) => (
            <PageSheet
              key={i}
              pageStyle={pageStyle}
              top={i * pageStride}
              widthIn={widthIn}
              heightIn={heightIn}
              index={i}
              total={pages}
            />
          ))}
          <div
            ref={contentRef}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: `${widthIn}in`,
              minHeight: totalH,
              paddingTop: `${padTopIn}in`,
              paddingLeft: `${padHIn}in`,
              paddingRight: `${padHIn}in`,
              paddingBottom: `${padBottomIn}in`,
              zIndex: 1,
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
