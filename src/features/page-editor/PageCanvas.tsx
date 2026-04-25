import { cn } from "@/lib/cn";
import { PAGE_SIZE_INCHES, type LetterPageStyle } from "@/lib/types/template";

interface Props {
  /** Variant drives the chrome surface kind. The actual paper size +
   *  orientation come from `pageStyle`. */
  variant: "letter" | "conducting" | "congregation";
  /** Page-level styling (border / paper / size / orientation). Falls
   *  back to letter-portrait when omitted. */
  pageStyle?: LetterPageStyle;
  /** Render-only chrome (ornament, eyebrow, title, date). Sits as a
   *  CSS-positioned overlay around the editable region. */
  chrome: React.ReactNode;
  /** The Lexical contenteditable subtree. */
  children: React.ReactNode;
  /** When true, tighten paddings + shadows for an on-screen authoring
   *  view. The print path keeps `false` so the canvas renders at true
   *  paper-sheet proportions. */
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

/** The visible paper sheet that the page editor lives inside. Sized
 *  in CSS `in` units so authoring + print paths share the same
 *  geometry. The bishop picks paper size + orientation via the
 *  page-style controls; the inner padding (margins) defaults to
 *  ~0.6–0.85 in. */
export function PageCanvas({ variant, pageStyle, chrome, children, compact }: Props) {
  const paperClass = pageStyle?.paper ? PAPER_BG_CLASS[pageStyle.paper] : "bg-chalk";
  const borderClass = pageStyle?.borderColor
    ? BORDER_COLOR_CLASS[pageStyle.borderColor]
    : "border-transparent";
  const borderWidth = pageStyle?.borderWidth ?? 0;
  const size = PAGE_SIZE_INCHES[pageStyle?.pageSize ?? "letter"];
  const landscape = (pageStyle?.orientation ?? "portrait") === "landscape";
  const widthIn = landscape ? size.height : size.width;
  const heightIn = landscape ? size.width : size.height;
  const padTopIn = variant === "letter" ? 0.85 : 0.6;
  return (
    <div
      className={cn(
        paperClass,
        "text-walnut font-serif relative mx-auto",
        compact
          ? "w-full max-w-[680px] px-8 py-10 rounded-md shadow-elev-3"
          : "shadow-[0_12px_40px_rgba(58,37,25,0.18)]",
        borderWidth > 0 && borderClass,
      )}
      style={
        compact
          ? borderWidth > 0
            ? { borderWidth: `${borderWidth}px`, borderStyle: "solid" }
            : undefined
          : {
              width: `${widthIn}in`,
              minHeight: `${heightIn}in`,
              paddingLeft: variant === "letter" ? "0.75in" : "0.6in",
              paddingRight: variant === "letter" ? "0.75in" : "0.6in",
              paddingTop: `${padTopIn}in`,
              paddingBottom: "0.6in",
              ...(borderWidth > 0 ? { borderWidth: `${borderWidth}px`, borderStyle: "solid" } : {}),
            }
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
