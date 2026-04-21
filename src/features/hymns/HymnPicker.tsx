import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Hymn } from "@/lib/types";
import { cn } from "@/lib/cn";
import { HYMNS } from "./hymns";
import { HymnPickerPopover } from "./HymnPickerPopover";

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
  const [direction, setDirection] = useState<"down" | "up">("down");
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
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

  // Flip the popover above the trigger if there isn't room for the full
  // max-height (~340px) below. Measured pre-paint so there's no jump.
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const MAX_POPOVER = 340;
    const GAP = 16;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    setDirection(
      spaceBelow < MAX_POPOVER + GAP && spaceAbove > spaceBelow ? "up" : "down",
    );
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
          ref={triggerRef}
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
            direction={direction}
          />
        )}
      </div>
    </div>
  );
}

