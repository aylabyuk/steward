import { Link } from "@/lib/nav";
import { useIsMobile } from "@/hooks/useMediaQuery";

/** Templates → Prayer invitation letter section. Sits beside the
 *  speaker letter card with a distinct visual treatment so the
 *  bishop can tell the two surfaces apart at a glance: walnut-toned
 *  eyebrow ("Prayer · Template") + a parchment-2 inner panel (vs the
 *  parchment-tinted speaker card). */
export function PrayerLetterSection(): React.ReactElement {
  const isMobile = useIsMobile();
  return (
    <section
      id="sec-prayer-letter"
      className="bg-chalk border border-border rounded-lg p-6 mb-4 scroll-mt-24"
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-walnut-3 font-medium">
          Prayer · Template
        </span>
        {isMobile && (
          <span className="inline-flex items-center rounded-full border border-border bg-parchment-2 px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-walnut-3">
            Desktop only
          </span>
        )}
      </div>
      <h2 className="font-display text-[22px] font-semibold text-walnut mb-1">
        Prayer invitation letter
      </h2>
      <p className="font-serif italic text-[14px] text-walnut-2 mb-5">
        A separate, shorter letter for opening + closing prayer-givers — uses{" "}
        <code className="font-mono text-[12px] text-walnut">{"{{prayerType}}"}</code> instead of the
        speaker's <code className="font-mono text-[12px] text-walnut">{"{{topic}}"}</code>.
      </p>

      <div className="flex items-center justify-between gap-4 p-4 rounded-md border border-walnut-3/30 bg-parchment-2">
        <p className="font-serif text-[13.5px] text-walnut-2 max-w-md">
          {isMobile
            ? "Open this on a laptop or tablet — the editor lays out the letter at print size (8.5 × 11)."
            : "Edit the body, footer, and signature of the prayer-giver invitation. Variables resolve to opening prayer or closing prayer depending on the slot."}
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
            to="/settings/templates/prayer-letter"
            className="inline-flex items-center shrink-0 font-sans text-[13px] font-semibold px-3.5 py-1.5 rounded-md border border-walnut bg-walnut text-parchment hover:bg-ink shadow-[0_1px_0_rgba(35,24,21,0.18)] transition-colors"
          >
            Open editor
          </Link>
        )}
      </div>
    </section>
  );
}
