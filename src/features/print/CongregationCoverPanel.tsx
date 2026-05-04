interface Props {
  wardName: string;
  dateLong: string;
  announcements: string;
  imageUrl: string | null;
}

/** Left half of the printed congregation bulletin. Pairs with
 *  `LegacyCongregationCopy` (the program panel on the right). The
 *  bulletin folds down the middle — this panel becomes the cover
 *  when folded. Uses a vertical flex column so the image expands to
 *  fill the page height, anchoring the header at the top and
 *  announcements at the bottom. Requires the parent grid item to
 *  have an explicit height (set in the print route + prepare page). */
export function CongregationCoverPanel({ wardName, dateLong, announcements, imageUrl }: Props) {
  const trimmed = announcements.trim();
  return (
    <div className="flex flex-col h-full">
      <header className="text-center mb-4 shrink-0">
        <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-walnut-3 m-0">
          The Church of Jesus Christ of Latter-day Saints
        </p>
        <h2 className="font-display text-[24px] font-semibold text-walnut tracking-[-0.01em] m-0 mt-1">
          {wardName}
        </h2>
        <p className="font-serif italic text-[12px] text-walnut-3 m-0 mt-1">{dateLong}</p>
      </header>

      <CoverImage imageUrl={imageUrl} />

      <section className="mt-4 shrink-0">
        <h3 className="font-display text-[13px] font-semibold text-walnut border-b border-brass-soft pb-1 mb-2">
          Announcements
        </h3>
        {trimmed.length > 0 ? (
          <p className="font-serif text-[12.5px] text-walnut-2 whitespace-pre-wrap leading-relaxed m-0">
            {trimmed}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <span className="print-blank block w-full" />
            <span className="print-blank block w-full" />
            <span className="print-blank block w-full" />
          </div>
        )}
      </section>
    </div>
  );
}

function CoverImage({ imageUrl }: { imageUrl: string | null }) {
  if (imageUrl) {
    return (
      <div className="flex-1 min-h-0 flex items-center justify-center my-3">
        {/* biome-ignore lint/performance/noImgElement: print output, not Next.js */}
        <img src={imageUrl} alt="" className="max-w-full max-h-full object-contain" />
      </div>
    );
  }
  return (
    <div className="flex-1 min-h-0 grid place-items-center my-3 border border-dashed border-walnut-3/40 rounded-md bg-parchment-2/30 print:bg-transparent">
      <span className="font-serif italic text-[12px] text-walnut-3">Image (optional)</span>
    </div>
  );
}
