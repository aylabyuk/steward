import { useEffect, useRef, useState } from "react";
import type { Hymn } from "@/lib/types";
import { HYMNS } from "./hymns";

interface Props {
  label: string;
  hymn: Hymn | null | undefined;
  onChange: (next: Hymn | null) => void;
}

const MAX_RESULTS = 8;

function match(h: Hymn, q: string): boolean {
  const low = q.toLowerCase();
  return h.title.toLowerCase().includes(low) || String(h.number).includes(q);
}

function display(h: Hymn): string {
  return `#${h.number} — ${h.title}`;
}

export function HymnPicker({ label, hymn, onChange }: Props) {
  const [query, setQuery] = useState(hymn ? display(hymn) : "");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(hymn ? display(hymn) : "");
  }, [hymn]);

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  const results = query
    ? HYMNS.filter((h) => match(h, query)).slice(0, MAX_RESULTS)
    : HYMNS.slice(0, MAX_RESULTS);

  function select(h: Hymn) {
    onChange(h);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1 sm:flex-row sm:items-center">
      <label className="w-32 shrink-0 text-sm font-medium text-slate-700">{label}</label>
      <div className="flex flex-1 gap-2">
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Type a number or title"
          className="flex-1 rounded-md border border-slate-300 px-2 py-1 text-sm"
        />
        {hymn && (
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setQuery("");
            }}
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
          >
            Clear
          </button>
        )}
      </div>
      {open && results.length > 0 && (
        <ul className="absolute left-32 right-0 top-full z-10 mt-1 max-h-60 overflow-auto rounded-md border border-slate-200 bg-white shadow-lg">
          {results.map((h) => (
            <li key={h.number}>
              <button
                type="button"
                onClick={() => select(h)}
                className="block w-full px-3 py-1 text-left text-sm hover:bg-slate-100"
              >
                {display(h)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
