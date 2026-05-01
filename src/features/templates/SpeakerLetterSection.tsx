import { Link } from "@/lib/nav";
import { useIsMobile } from "@/hooks/useMediaQuery";

/** Templates → Speaker invitation letter section. The letter editor
 *  needs the full viewport for its 8.5×11 preview, so this section is
 *  a CTA card that links out to the standalone editor (same tab; the
 *  editor's own back arrow returns here). The CTA is disabled on
 *  phone-class viewports — the editor itself shows a "Desktop only"
 *  notice if the user gets there another way (typed URL, deep link
 *  from elsewhere). */
export function SpeakerLetterSection(): React.ReactElement {
  const isMobile = useIsMobile();
  return (
    <section
      id="sec-speaker-letter"
      className="bg-chalk border border-border rounded-lg p-6 mb-4 scroll-mt-24"
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-brass-deep font-medium">
          Template
        </span>
        {isMobile && (
          <span className="inline-flex items-center rounded-full border border-border bg-parchment-2 px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-walnut-3">
            Desktop only
          </span>
        )}
      </div>
      <h2 className="font-display text-[22px] font-semibold text-walnut mb-1">
        Speaker invitation letter
      </h2>
      <p className="font-serif italic text-[14px] text-walnut-2 mb-5">
        The printable letter rendered on the speaker's invitation page. The editor lays out the
        letter at print size (8.5 × 11), so it opens as a full-viewport page.
      </p>

      <div className="flex items-center justify-between gap-4 p-4 rounded-md border border-border bg-parchment/70">
        <p className="font-serif text-[13.5px] text-walnut-2 max-w-md">
          {isMobile
            ? "Open this on a laptop or tablet — the editor lays out the letter at print size (8.5 × 11)."
            : "Edit the body, footer, and signature of the printed invitation. The editor itself shows the letter as speakers will see it."}
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
            to="/settings/templates/speaker-letter"
            className="inline-flex items-center shrink-0 font-sans text-[13px] font-semibold px-3.5 py-1.5 rounded-md border border-walnut bg-walnut text-parchment hover:bg-ink shadow-[0_1px_0_rgba(35,24,21,0.18)] transition-colors"
          >
            Open editor
          </Link>
        )}
      </div>
    </section>
  );
}
