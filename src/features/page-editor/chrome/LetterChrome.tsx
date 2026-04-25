interface Props {
  wardName: string;
  /** Today's date label, e.g. "April 21, 2026". The bishop's letter
   *  shows this near the top so it reads like a real letter. */
  today: string;
  /** Footer rule decoration: ✦ ornament + scripture or motto. The
   *  scripture lives inside the editable region as an ordinary
   *  paragraph (post-WYSIWYG migration); only the ornament + rule
   *  ship as chrome. */
  children: React.ReactNode;
}

/** Render-only chrome around the editable letter content: the brass
 *  ornament + ward eyebrow + "Invitation to Speak" title + "From the
 *  Bishopric" sub-eyebrow + today's date + a closing rule with the
 *  ✦ ornament. Verbatim extract from `LetterCanvas`'s LetterHeader +
 *  the date + bottom rule, minus the editable signature row (now
 *  `SignatureBlockNode`) and minus the assigned-Sunday callout (now
 *  `AssignedSundayCalloutNode`). */
export function LetterChrome({ wardName, today, children }: Props) {
  return (
    <>
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

      <div className="font-mono text-[11px] tracking-[0.14em] uppercase text-walnut-3 mb-5">
        {today}
      </div>

      {children}
    </>
  );
}
