import { Link } from "@/lib/nav";
import { useIsMobile } from "@/hooks/useMediaQuery";

/** Templates → Program templates section. The conducting + congregation
 *  program editors share a dedicated full-viewport page (Lexical with
 *  variable chips), so this section is a CTA card that navigates to
 *  the editor (same tab; the editor's own back arrow returns here).
 *  The CTA is disabled on phone-class viewports — the editor itself
 *  shows a "Desktop only" notice if the user reaches the URL another
 *  way. */
export function ProgramTemplatesSection(): React.ReactElement {
  const isMobile = useIsMobile();
  return (
    <section
      id="sec-program-templates"
      className="bg-chalk border border-border rounded-lg p-6 mb-4 scroll-mt-24"
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-brass-deep font-medium">
          Templates
        </span>
        {isMobile && (
          <span className="inline-flex items-center rounded-full border border-border bg-parchment-2 px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-walnut-3">
            Desktop only
          </span>
        )}
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
          {isMobile
            ? "Open this on a laptop or tablet — the editor lays out the program at print size."
            : "Edit the conducting and congregation copies. Variable chips render against sample meeting data so the editor reads as the printed page."}
        </p>
        {isMobile ? (
          <span
            aria-disabled="true"
            className="inline-flex items-center shrink-0 font-sans text-[13px] font-semibold px-3.5 py-1.5 rounded-md border border-border bg-parchment-2 text-walnut-3 cursor-not-allowed"
          >
            Open editor
          </span>
        ) : (
          <Link
            to="/settings/templates/programs"
            className="inline-flex items-center shrink-0 font-sans text-[13px] font-semibold px-3.5 py-1.5 rounded-md border border-walnut bg-walnut text-parchment hover:bg-ink shadow-[0_1px_0_rgba(35,24,21,0.18)] transition-colors"
          >
            Open editor
          </Link>
        )}
      </div>
    </section>
  );
}
