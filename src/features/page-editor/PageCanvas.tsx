import { cn } from "@/lib/cn";
import type { LetterPageStyle } from "@/lib/types/template";

interface Props {
  /** Variant drives the natural width + chrome surface. `letter` is
   *  8.5 × 11 in print; `conducting` / `congregation` add pagination
   *  in Phase 3. */
  variant: "letter" | "conducting" | "congregation";
  /** Page-level styling (border + paper) — falls back to the variant
   *  default when omitted. Edited via `PageStylePanel` (Phase 1
   *  follow-up). */
  pageStyle?: LetterPageStyle;
  /** Render-only chrome (ornament, eyebrow, title, date). Sits as a
   *  CSS-positioned overlay around the editable region. */
  chrome: React.ReactNode;
  /** The Lexical contenteditable subtree. The canvas reserves vertical
   *  space for the chrome and lets the contenteditable claim the rest
   *  of the page; long content extends the page naturally. */
  children: React.ReactNode;
  /** When true, tighten paddings + shadows for an on-screen authoring
   *  view. The print path keeps `false` so the canvas renders at true
   *  letter-sheet proportions. */
  compact?: boolean;
}

const PAPER_BG_CLASS: Record<NonNullable<LetterPageStyle["paper"]>, string> = {
  chalk: "bg-chalk",
  parchment: "bg-parchment",
  "parchment-2": "bg-parchment-2",
};

const BORDER_COLOR_CLASS: Record<NonNullable<LetterPageStyle["borderColor"]>, string> = {
  none: "border-transparent",
  walnut: "border-walnut-3",
  "brass-deep": "border-brass-deep",
  bordeaux: "border-bordeaux",
};

/** The visible 8.5 × 11 paper that the page editor lives inside.
 *  Chalk background, drop shadow, exact-DPI dimensions in CSS `in`
 *  units, printer margins as inner padding. Chrome overlays the
 *  content area; the editable region scrolls inside the page —
 *  the page itself sits inside whatever scroll container the host
 *  route provides. */
export function PageCanvas({ variant, pageStyle, chrome, children, compact }: Props) {
  const paperClass = pageStyle?.paper ? PAPER_BG_CLASS[pageStyle.paper] : "bg-chalk";
  const borderClass = pageStyle?.borderColor
    ? BORDER_COLOR_CLASS[pageStyle.borderColor]
    : "border-transparent";
  const borderWidth = pageStyle?.borderWidth ?? 0;
  const isLetter = variant === "letter";
  return (
    <div
      className={cn(
        paperClass,
        "text-walnut font-serif relative mx-auto",
        compact
          ? "w-full max-w-[680px] px-8 py-10 rounded-md shadow-elev-3"
          : isLetter
            ? "w-[8.5in] min-h-[11in] px-[0.75in] pt-[0.85in] pb-[0.6in] shadow-[0_12px_40px_rgba(58,37,25,0.18)]"
            : "w-[8.5in] min-h-[11in] px-[0.6in] pt-[0.6in] pb-[0.6in] shadow-[0_12px_40px_rgba(58,37,25,0.18)]",
        borderWidth > 0 && borderClass,
      )}
      style={
        borderWidth > 0 ? { borderWidth: `${borderWidth}px`, borderStyle: "solid" } : undefined
      }
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-4 sm:inset-6 border border-brass-soft/40"
      />
      {chrome}
      {children}
    </div>
  );
}
