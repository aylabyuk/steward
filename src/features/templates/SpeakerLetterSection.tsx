import { Link } from "react-router";

/** Templates → Speaker invitation letter section. The letter editor
 *  needs the full viewport for its 8.5×11 preview, so this section
 *  is a CTA card that links out to the standalone editor in a new
 *  tab. Keeps the combined Templates page coherent without cramping
 *  the preview. */
export function SpeakerLetterSection(): React.ReactElement {
  return (
    <section
      id="sec-speaker-letter"
      className="bg-chalk border border-border rounded-lg p-6 mb-4 scroll-mt-24"
    >
      <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-brass-deep font-medium mb-1">
        Template
      </div>
      <h2 className="font-display text-[22px] font-semibold text-walnut mb-1">
        Speaker invitation letter
      </h2>
      <p className="font-serif italic text-[14px] text-walnut-2 mb-5">
        The printable letter rendered on the speaker's invitation page. Edits open in a dedicated
        tab so the 8.5 × 11 preview has the viewport it needs.
      </p>

      <div className="flex items-center justify-between gap-4 p-4 rounded-md border border-border bg-parchment/70">
        <p className="font-serif text-[13.5px] text-walnut-2 max-w-md">
          Edit the body, footer, and signature of the printed invitation. A live preview shows the
          letter as speakers will see it.
        </p>
        <Link
          to="/settings/templates/speaker-letter"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 shrink-0 font-sans text-[13px] font-semibold px-3.5 py-1.5 rounded-md border border-walnut bg-walnut text-parchment hover:bg-ink shadow-[0_1px_0_rgba(35,24,21,0.18)] transition-colors"
        >
          Open editor
          <NewTabIcon />
        </Link>
      </div>
    </section>
  );
}

function NewTabIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 17L17 7M7 7h10v10" />
    </svg>
  );
}
