interface Props {
  /** Mono-brass leading label — the speaker number ("01"…"04") or the
   *  prayer role ("Opening" / "Benediction"). */
  leadingLabel: string;
  /** Width class for the leading column so speaker number ("01")
   *  + prayer role ("Benediction") align to the same baseline as the
   *  filled rows above them. */
  leadingWidthCls?: string;
}

/** Roster placeholder row used by the Sunday card to fill empty
 *  speaker + prayer slots so each card has a uniform vertical
 *  rhythm regardless of how full the planning is. Same height +
 *  visual treatment as a filled row without status chip / chat
 *  launcher (placeholders carry no actionable affordances yet). */
export function EmptyRosterRow({ leadingLabel, leadingWidthCls = "w-6" }: Props) {
  return (
    <li className="flex items-center gap-3 h-10 border-b border-border last:border-b-0">
      <div
        className={`font-mono text-[10.5px] tracking-[0.08em] text-brass-deep shrink-0 ${leadingWidthCls}`}
      >
        {leadingLabel}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-serif italic text-sm text-walnut-3 truncate">Not assigned</div>
      </div>
    </li>
  );
}
