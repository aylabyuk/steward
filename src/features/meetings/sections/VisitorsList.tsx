import { useEffect, useState } from "react";
import type { Visitor } from "@/lib/types";

interface Props {
  visitors: readonly Visitor[];
  onChange: (next: Visitor[]) => void;
}

const INPUT_CLS =
  "font-sans text-[14px] px-2.5 py-1.5 bg-parchment border border-transparent rounded-md text-walnut w-full transition-colors placeholder:text-walnut-3 placeholder:italic hover:border-border-strong hover:bg-chalk focus:outline-none focus:border-bordeaux focus:bg-chalk focus:ring-2 focus:ring-bordeaux/15";

export function VisitorsList({ visitors, onChange }: Props) {
  function update(i: number, patch: Partial<Visitor>) {
    const next = visitors.map((v, idx) => (idx === i ? { ...v, ...patch } : v));
    onChange([...next]);
  }

  function remove(i: number) {
    onChange(visitors.filter((_, idx) => idx !== i));
  }

  function add() {
    onChange([...visitors, { name: "", details: "" }]);
  }

  return (
    <div className="mt-5 pt-4 border-t border-dashed border-border">
      <div className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-brass-deep mb-2.5">
        Visitors on the stand
      </div>
      {visitors.length === 0 ? (
        <p className="font-serif italic text-[13px] text-walnut-3 py-1">
          None yet — optional. Add stake leaders, a mission president, or other recognized guests.
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {visitors.map((v, i) => (
            <VisitorRow
              key={i}
              index={i}
              visitor={v}
              onChange={(patch) => update(i, patch)}
              onRemove={() => remove(i)}
            />
          ))}
        </ul>
      )}
      <button
        type="button"
        onClick={add}
        className="mt-2 inline-flex items-center gap-1.5 font-sans text-[13px] font-semibold text-bordeaux hover:text-bordeaux-deep transition-colors py-1.5"
      >
        <span className="w-4 h-4 border border-bordeaux rounded-sm flex items-center justify-center">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
        </span>
        Add visitor
      </button>
    </div>
  );
}

interface VisitorRowProps {
  index: number;
  visitor: Visitor;
  onChange: (patch: Partial<Visitor>) => void;
  onRemove: () => void;
}

function VisitorRow({ index, visitor, onChange, onRemove }: VisitorRowProps) {
  const [name, setName] = useState(visitor.name);
  const [details, setDetails] = useState(visitor.details ?? "");

  useEffect(() => setName(visitor.name), [visitor.name]);
  useEffect(() => setDetails(visitor.details ?? ""), [visitor.details]);

  function commit<T extends keyof Visitor>(field: T, local: string) {
    const current = (visitor[field] ?? "") as string;
    if (local.trim() === current.trim()) return;
    onChange({ [field]: local.trim() } as Partial<Visitor>);
  }

  return (
    <li className="grid grid-cols-[28px_minmax(0,1fr)_minmax(0,1fr)_28px] gap-2 items-center py-1">
      <span className="font-mono text-[10.5px] tracking-[0.08em] text-brass-deep">
        {String(index + 1).padStart(2, "0")}
      </span>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => commit("name", name)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            commit("name", name);
            (e.target as HTMLInputElement).blur();
          }
        }}
        placeholder="e.g. President Smith"
        className={INPUT_CLS}
      />
      <input
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        onBlur={() => commit("details", details)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            commit("details", details);
            (e.target as HTMLInputElement).blur();
          }
        }}
        placeholder="Calling or role (optional)"
        className={INPUT_CLS}
      />
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove visitor"
        className="w-6 h-6 inline-flex items-center justify-center rounded text-walnut-3 hover:text-bordeaux hover:bg-parchment-2 transition-colors"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
      </button>
    </li>
  );
}
