interface Props {
  unseenCount: number;
  onJump: () => void;
}

/** Floating pill over the bottom of the scroll region. Appears when
 *  the user has scrolled up (parent decides); surfaces the count of
 *  messages that arrived while they were reading history. Click or
 *  Enter/Space activates jump-to-bottom. */
export function JumpToLatest({ unseenCount, onJump }: Props): React.ReactElement {
  const label = labelFor(unseenCount);
  return (
    <button
      type="button"
      onClick={onJump}
      className="absolute left-1/2 -translate-x-1/2 bottom-3 font-sans text-[12px] font-semibold px-3 py-1.5 rounded-full bg-bordeaux text-parchment border border-bordeaux-deep shadow-[0_2px_6px_rgba(35,24,21,0.25)] hover:bg-bordeaux-deep focus:outline-none focus-visible:ring-2 focus-visible:ring-bordeaux/40 transition-colors"
      aria-label={label}
    >
      {unseenCount > 0 && (
        <span
          aria-hidden="true"
          className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-parchment text-bordeaux text-[10.5px] font-bold mr-1.5 align-[-1px]"
        >
          {unseenCount > 99 ? "99+" : unseenCount}
        </span>
      )}
      <span aria-hidden="true">↓ Latest</span>
    </button>
  );
}

function labelFor(unseen: number): string {
  if (unseen === 0) return "Jump to latest";
  if (unseen === 1) return "1 new · jump to latest";
  return `${unseen} new · jump to latest`;
}
