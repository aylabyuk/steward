import { cn } from "@/lib/cn";
import type { LetterPageStyle } from "@/lib/types/template";

const PAPER_BG: Record<NonNullable<LetterPageStyle["paper"]>, string> = {
  chalk: "bg-chalk",
  parchment: "bg-parchment",
  "parchment-2": "bg-parchment-2",
};

const BORDER_COLOR: Record<NonNullable<LetterPageStyle["borderColor"]>, string> = {
  none: "border-transparent",
  walnut: "border-walnut-3",
  "brass-deep": "border-brass-deep",
  bordeaux: "border-bordeaux",
};

interface Props {
  pageStyle?: LetterPageStyle;
  /** Absolute Y in the parent stage (CSS px). */
  top: number;
  widthIn: number;
  heightIn: number;
  /** Page index for the "Page n of N" label in the bottom-right corner. */
  index: number;
  total: number;
}

/** A single visible paper sheet — paper color, optional border, drop
 *  shadow, decorative brass inset rule, and a "Page n of N" footer
 *  marker. Render-only; lives behind the editor's content layer. */
export function PageSheet({ pageStyle, top, widthIn, heightIn, index, total }: Props) {
  const paper = pageStyle?.paper ? PAPER_BG[pageStyle.paper] : "bg-chalk";
  const borderClass = pageStyle?.borderColor
    ? BORDER_COLOR[pageStyle.borderColor]
    : "border-transparent";
  const borderWidth = pageStyle?.borderWidth ?? 0;
  return (
    <div
      aria-hidden
      className={cn(
        paper,
        "absolute shadow-[0_12px_40px_rgba(58,37,25,0.18)]",
        borderWidth > 0 && borderClass,
      )}
      style={{
        top,
        left: 0,
        width: `${widthIn}in`,
        height: `${heightIn}in`,
        ...(borderWidth > 0 ? { borderWidth: `${borderWidth}px`, borderStyle: "solid" } : {}),
      }}
    >
      <div className="pointer-events-none absolute inset-4 sm:inset-6 border border-brass-soft/40" />
      {total > 1 && (
        <div className="pointer-events-none absolute bottom-2 right-3 font-mono text-[9.5px] uppercase tracking-[0.14em] text-walnut-3">
          Page {index + 1} of {total}
        </div>
      )}
    </div>
  );
}
