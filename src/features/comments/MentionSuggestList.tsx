import type { WithId } from "@/hooks/_sub";
import type { Member } from "@/lib/types";
import { cn } from "@/lib/cn";

interface Props {
  matches: readonly WithId<Member>[];
  highlight: number;
  onSelect: (member: WithId<Member>) => void;
  onHover: (index: number) => void;
}

/** Popover for the @-mention autosuggest in `CommentForm`. Anchored
 *  below the textarea (full width). Click selects, hover updates the
 *  highlight (so click + arrow stay in sync). Keyboard handling
 *  lives on the textarea — see `CommentForm`'s onKeyDown. */
export function MentionSuggestList({ matches, highlight, onSelect, onHover }: Props) {
  return (
    <ul
      role="listbox"
      aria-label="Mention suggestions"
      className="absolute left-0 right-0 top-full mt-1 z-30 max-h-56 overflow-y-auto rounded-md border border-border bg-chalk shadow-elev-2 list-none m-0 p-1"
    >
      {matches.map((m, i) => (
        <li key={m.id}>
          <button
            type="button"
            role="option"
            aria-selected={i === highlight}
            onMouseDown={(e) => {
              // mousedown so the button steals focus from the textarea
              // synchronously — but preventDefault keeps the textarea
              // focused so the inserted caret position sticks.
              e.preventDefault();
              onSelect(m);
            }}
            onMouseEnter={() => onHover(i)}
            className={cn(
              "w-full text-left flex items-center gap-2.5 px-2.5 py-2 rounded-sm transition-colors",
              i === highlight ? "bg-parchment-2" : "bg-transparent hover:bg-parchment",
            )}
          >
            <Avatar photoURL={m.data.photoURL} displayName={m.data.displayName} />
            <span className="font-sans text-[14px] text-walnut truncate">{m.data.displayName}</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-walnut-3 ml-auto">
              {m.data.role}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function Avatar({ photoURL, displayName }: { photoURL?: string; displayName: string }) {
  if (photoURL) {
    return (
      <img
        src={photoURL}
        alt=""
        aria-hidden
        className="w-6 h-6 rounded-full object-cover shrink-0"
      />
    );
  }
  const initial = displayName.trim().charAt(0).toUpperCase() || "?";
  return (
    <span
      aria-hidden
      className="w-6 h-6 rounded-full bg-parchment-2 border border-border flex items-center justify-center font-mono text-[11px] text-walnut shrink-0"
    >
      {initial}
    </span>
  );
}
