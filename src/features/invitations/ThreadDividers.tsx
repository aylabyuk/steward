/** Slim horizontal rules with a centered eyebrow label. Day dividers
 *  separate messages by local date; the unread divider marks the
 *  first message the participant hasn't read in this session. */
export function DayDivider({ label }: { label: string }): React.ReactElement {
  return (
    <div className="flex items-center gap-2 -my-1" aria-label={label}>
      <div className="flex-1 h-px bg-border" />
      <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-walnut-3">
        {label}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

export function UnreadDivider(): React.ReactElement {
  return (
    <div className="flex items-center gap-2 -my-1" aria-label="New messages">
      <div className="flex-1 h-px bg-bordeaux/40" />
      <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-bordeaux">New</span>
      <div className="flex-1 h-px bg-bordeaux/40" />
    </div>
  );
}
