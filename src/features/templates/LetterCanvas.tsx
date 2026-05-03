import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/cn";
import { renderLetterState } from "@/features/page-editor/utils/renderLetterState";

/** Natural width of the full letter-sheet variant, in CSS pixels.
 *  8.5 in × 96 dpi = 816 px. Exported so preview wrappers can compute
 *  a fit-to-container scale factor (see `useFitScale`). */
export const LETTER_CANVAS_WIDTH_PX = 816;
/** Natural min-height (11 in × 96 dpi). Actual height grows if the
 *  letter body is long; scaling to this value keeps the typical
 *  one-page letter in view with no preview scrollbar. */
export const LETTER_CANVAS_HEIGHT_PX = 1056;

interface Props {
  wardName: string;
  assignedDate: string; // e.g. "Sunday, April 26, 2026"
  today: string; // e.g. "April 21, 2026"
  bodyMarkdown: string; // post-interpolation
  footerMarkdown: string; // post-interpolation
  /** WYSIWYG-authored Lexical state, post-interpolation. When
   *  present the canvas renders via the Lexical-aware walker — the
   *  bishop's letterhead / callouts / signature show through
   *  faithfully. Absent (legacy snapshots) → fall back to the
   *  hardcoded chrome + markdown path. */
  editorStateJson?: string;
  /** When true, tighten paddings + shadows for an on-screen preview
   *  inside the settings page. The landing page + PDF paths skip this
   *  so the letter renders at true letter-sheet proportions. */
  compact?: boolean;
  /** Reference-only metadata stamp rendered in the page's bottom
   *  margin, visually outside the letter card. Captured in PDF export
   *  so the holder of a printed copy knows which version they have.
   *  Omitted on live preview / embed paths so the on-screen paper
   *  stays clean while editing. */
  versionStamp?: { label: "Saved" | "Sent"; text: string };
}

/**
 * The static chrome around a speaker invitation letter: ornament,
 * eyebrow (`SACRAMENT MEETING · {wardName}`), title, subtitle, date,
 * markdown body, "Assigned Sunday" callout, signature line, and
 * scripture footer. This component is shared between the settings
 * preview, the (upcoming) public landing page, and the PDF render.
 */
export function LetterCanvas({
  wardName,
  assignedDate,
  today,
  bodyMarkdown,
  footerMarkdown,
  editorStateJson,
  compact,
  versionStamp,
}: Props) {
  const rendered = editorStateJson ? renderLetterState(editorStateJson, { assignedDate }) : null;
  return (
    <div
      data-letter-page
      className={cn(
        // Typography rules mirror the editor's contenteditable
        // (`prose prose-sm font-serif text-[16.5px] leading-[1.65]
        // [&_em]:text-bordeaux [&_strong]:text-walnut`) so an italic
        // chip stays bordeaux + a bold span stays walnut on the
        // printed sheet — the bishop sees the same colours that
        // were on screen. Without this the print path rendered
        // italic in default walnut and lost the visual rhythm.
        "bg-chalk text-walnut font-serif text-[16.5px] leading-[1.65] relative",
        "[&_em]:text-bordeaux [&_em]:italic [&_strong]:font-semibold [&_strong]:text-walnut",
        compact
          ? "w-full max-w-[680px] px-8 py-10 rounded-md shadow-elev-3"
          : "w-[8.5in] min-h-[11in] px-[0.75in] pt-[0.85in] pb-[0.6in] shadow-[0_12px_40px_rgba(58,37,25,0.18)]",
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-4 sm:inset-6 border border-brass-soft/40"
      />

      {rendered ? (
        // The Lexical state already carries the bishop's authored
        // letterhead, callouts, signature, and footer — render it
        // straight through. No hardcoded chrome to avoid duplication.
        rendered
      ) : (
        <>
          <LetterHeader wardName={wardName} />

          <div className="font-mono text-[11px] tracking-[0.14em] uppercase text-walnut-3 mb-5">
            {today}
          </div>

          <LetterBody markdown={bodyMarkdown} assignedDate={assignedDate} />

          <LetterSignature />

          <div className="mt-9 pt-3 border-t border-border font-mono text-[9.5px] tracking-[0.18em] uppercase text-walnut-3 text-center">
            ✦ &nbsp; {footerMarkdown} &nbsp; ✦
          </div>
        </>
      )}

      {versionStamp && <VersionStamp stamp={versionStamp} compact={compact === true} />}
    </div>
  );
}

/** Reference-only metadata, sitting in the page's bottom margin so
 *  the holder of a printed copy can identify which version they have.
 *  Visually + structurally separate from the letter content above. */
function VersionStamp({
  stamp,
  compact,
}: {
  stamp: { label: "Saved" | "Sent"; text: string };
  compact: boolean;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute left-0 right-0 text-center",
        "font-mono text-[8.5px] tracking-[0.18em] uppercase text-walnut-3/60",
        compact ? "bottom-2" : "bottom-[0.3in]",
      )}
    >
      {stamp.label} {stamp.text}
    </div>
  );
}

function LetterHeader({ wardName }: { wardName: string }) {
  return (
    <div className="text-center pb-5 border-b border-border mb-8">
      <div className="flex items-center justify-center gap-3.5 mb-3.5">
        <span className="w-9 h-9 border border-brass-soft rounded-full inline-flex items-center justify-center text-brass-deep text-lg">
          ✦
        </span>
      </div>
      <div className="font-mono text-[11px] tracking-[0.3em] uppercase text-walnut-3 mb-2">
        Sacrament Meeting{wardName ? ` · ${wardName}` : ""}
      </div>
      <div className="font-display text-[28px] italic text-walnut tracking-[-0.01em]">
        Invitation to Speak
      </div>
      <div className="mt-2.5 font-mono text-[10px] tracking-[0.22em] uppercase text-walnut-3">
        From the Bishopric
      </div>
    </div>
  );
}

interface LetterBodyProps {
  markdown: string;
  assignedDate: string;
}

function LetterBody({ markdown, assignedDate }: LetterBodyProps) {
  // The "Assigned Sunday" callout is rendered structurally (not via
  // Markdown) because its styling is part of the fixed letter chrome.
  // The editable body flows before + after it — but since the seed
  // content places the "topic" paragraph as the first paragraph after
  // the callout, we render the callout between paragraphs 1 and 2.
  const paragraphs = splitParagraphs(markdown);
  const [first, ...rest] = paragraphs;
  return (
    <>
      {first && <MarkdownBlock markdown={first} />}
      <div className="my-5 px-6 py-4 bg-gradient-to-b from-brass-soft/15 to-brass-soft/5 border-l-2 border-brass rounded-r-md">
        <div className="font-mono text-[9.5px] tracking-[0.22em] uppercase text-brass-deep mb-2">
          Assigned Sunday
        </div>
        <div className="font-display text-[22px] italic text-walnut">{assignedDate}</div>
      </div>
      {rest.map((p, i) => (
        <MarkdownBlock key={i} markdown={p} />
      ))}
    </>
  );
}

function MarkdownBlock({ markdown }: { markdown: string }) {
  return (
    <div className="font-serif text-[16.5px] leading-[1.65] text-walnut-2 mb-4 [&_em]:text-bordeaux [&_em]:italic [&_strong]:font-semibold [&_strong]:text-walnut">
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </div>
  );
}

function LetterSignature() {
  return (
    <div className="mt-8">
      <div className="border-b border-walnut-3 w-[280px] mb-1.5" />
      <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-walnut-3">
        The Bishopric
      </div>
    </div>
  );
}

function splitParagraphs(markdown: string): string[] {
  return markdown
    .split(/\n{2,}/)
    .map((s) => s.trim())
    .filter(Boolean);
}
