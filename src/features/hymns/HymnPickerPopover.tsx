import type { Hymn } from "@/lib/types";
import { cn } from "@/lib/cn";

interface Props {
  inputRef: React.RefObject<HTMLInputElement | null>;
  query: string;
  setQuery: (q: string) => void;
  results: readonly Hymn[];
  focused: number;
  setFocused: (i: number | ((prev: number) => number)) => void;
  suggestions: readonly number[] | undefined;
  current: Hymn | null | undefined;
  onPick: (h: Hymn) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  direction: "down" | "up";
}

export function HymnPickerPopover({
  inputRef,
  query,
  setQuery,
  results,
  focused,
  setFocused,
  suggestions,
  current,
  onPick,
  onKeyDown,
  direction,
}: Props) {
  return (
    <div
      className={cn(
        "absolute left-0 right-0 z-30 bg-chalk border border-walnut-3 rounded-lg shadow-elev-3 overflow-hidden flex flex-col max-h-85",
        direction === "down"
          ? "top-full mt-1 animate-[menuIn_120ms_ease-out]"
          : "bottom-full mb-1 animate-[menuInUp_120ms_ease-out]",
      )}
    >
      <div className="p-2 border-b border-border bg-parchment">
        <input
          ref={inputRef}
          placeholder="Search by number or title"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setFocused(0);
          }}
          onKeyDown={onKeyDown}
          className="w-full font-sans text-[13.5px] px-2.5 py-1.5 bg-chalk border border-border rounded-md text-walnut placeholder:text-walnut-3 placeholder:italic focus:outline-none focus:border-bordeaux focus:ring-2 focus:ring-bordeaux/15"
        />
      </div>
      {!query && suggestions && suggestions.length > 0 && (
        <div className="px-3 pt-2 pb-1 font-mono text-[9.5px] uppercase tracking-[0.14em] text-brass-deep">
          Suggested
        </div>
      )}
      <div className="overflow-y-auto py-1.5">
        {results.length === 0 ? (
          <div className="px-3 py-3.5 font-serif italic text-[13px] text-walnut-3 text-center">
            No matches — try a different number or word.
          </div>
        ) : (
          results.map((h, i) => (
            <button
              key={h.number}
              type="button"
              onMouseEnter={() => setFocused(i)}
              onClick={() => onPick(h)}
              className={cn(
                "w-full grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-2.5 px-3 py-1.5 text-left cursor-pointer transition-colors",
                focused === i ? "bg-parchment" : "hover:bg-parchment",
                current?.number === h.number && "bg-success-soft/60",
              )}
            >
              <span className="font-mono text-[12px] font-semibold text-bordeaux-deep tracking-[0.04em]">
                {h.number}
              </span>
              <span className="font-serif text-[14px] text-walnut truncate">{h.title}</span>
              {current?.number === h.number && (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-success"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
