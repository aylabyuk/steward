import { useEffect, useMemo, useRef, useState } from "react";
import type { Hymn } from "@/lib/types";
import { cn } from "@/lib/cn";
import { HYMNS } from "./hymns";

interface Props {
  label: string;
  hymn: Hymn | null | undefined;
  suggestions?: readonly number[];
  placeholder?: string;
  onChange: (next: Hymn | null) => void;
}

const MAX_RESULTS = 40;

export function HymnPicker({ label, hymn, suggestions, placeholder = "Pick a hymn", onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasValue = Boolean(hymn?.number);

  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const q = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (!q) {
      const sugSet = new Set(suggestions ?? []);
      const sug = HYMNS.filter((h) => sugSet.has(h.number));
      const rest = HYMNS.filter((h) => !sugSet.has(h.number));
      return [...sug, ...rest].slice(0, MAX_RESULTS);
    }
    if (/^\d+$/.test(q)) {
      return HYMNS.filter((h) => String(h.number).startsWith(q)).slice(0, MAX_RESULTS);
    }
    return HYMNS.filter((h) => h.title.toLowerCase().includes(q)).slice(0, MAX_RESULTS);
  }, [q, suggestions]);

  function pick(h: Hymn) {
    onChange(h);
    setOpen(false);
    setQuery("");
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setFocused((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocused((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && focused >= 0 && results[focused]) {
      e.preventDefault();
      pick(results[focused]);
    }
  }

  return (
    <div ref={containerRef} className="grid grid-cols-[86px_minmax(0,1fr)] items-center gap-3 py-2.5 border-b border-dashed border-border last:border-b-0">
      <div className="text-[13.5px] font-sans font-medium text-walnut-2">{label}</div>
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setTimeout(() => inputRef.current?.focus(), 0);
          }}
          className={cn(
            "w-full grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-3 px-3 py-1.5 rounded-md border cursor-pointer transition-colors text-left",
            open
              ? "border-bordeaux bg-chalk shadow-[0_0_0_2px_rgba(139,46,42,0.12)]"
              : "border-border bg-parchment hover:border-border-strong hover:bg-chalk",
          )}
        >
          {hasValue && hymn ? (
            <>
              <span className="font-mono text-[13px] font-semibold text-bordeaux-deep tracking-[0.04em] min-w-7">
                {hymn.number}
              </span>
              <span className="font-serif text-[14.5px] text-walnut truncate">{hymn.title}</span>
              <span
                role="button"
                aria-label="Clear hymn"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(null);
                  setQuery("");
                }}
                className="w-5 h-5 inline-flex items-center justify-center rounded-full text-walnut-3 hover:bg-parchment-2 hover:text-bordeaux"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </span>
            </>
          ) : (
            <span className="col-span-3 font-serif italic text-[14px] text-walnut-3">{placeholder}</span>
          )}
          <svg className="text-walnut-3" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        {open && (
          <HymnPickerPopover
            inputRef={inputRef}
            query={query}
            setQuery={setQuery}
            results={results}
            focused={focused}
            setFocused={setFocused}
            suggestions={suggestions}
            current={hymn}
            onPick={pick}
            onKeyDown={onKeyDown}
          />
        )}
      </div>
    </div>
  );
}

interface PopoverProps {
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
}

function HymnPickerPopover({
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
}: PopoverProps) {
  return (
    <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-chalk border border-walnut-3 rounded-lg shadow-elev-3 overflow-hidden flex flex-col max-h-85 animate-[menuIn_120ms_ease-out]">
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
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-success">
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
