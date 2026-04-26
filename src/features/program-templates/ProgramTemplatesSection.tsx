import { Link } from "react-router";

/** Templates → Program templates section. The conducting + congregation
 *  program editors share a dedicated full-viewport page (Lexical with
 *  variable chips and a live preview), so this section is a CTA card
 *  that links out in a new tab. */
export function ProgramTemplatesSection(): React.ReactElement {
  return (
    <section
      id="sec-program-templates"
      className="bg-chalk border border-border rounded-lg p-6 mb-4 scroll-mt-24"
    >
      <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-brass-deep font-medium mb-1">
        Templates
      </div>
      <h2 className="font-display text-[22px] font-semibold text-walnut mb-1">
        Sacrament meeting program
      </h2>
      <p className="font-serif italic text-[14px] text-walnut-2 mb-5">
        Author the conducting + congregation copies of the printed program. Variables for date,
        leadership, hymns, and speakers stand in as visual chips and resolve at print time.
      </p>

      <div className="flex items-center justify-between gap-4 p-4 rounded-md border border-border bg-parchment/70">
        <p className="font-serif text-[13.5px] text-walnut-2 max-w-md">
          Editor opens in a dedicated tab with a side-by-side preview using sample meeting data.
        </p>
        <Link
          to="/settings/templates/programs"
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
