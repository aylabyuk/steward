import { useEffect, useRef, useState } from "react";
import type { ProgramMargins, ProgramTemplateKey } from "@/lib/types";
import { DEFAULT_MARGINS } from "./ProgramCanvas";

interface Props {
  variant: ProgramTemplateKey;
  margins: ProgramMargins;
  onChange: (next: ProgramMargins) => void;
}

const MIN = 0.25;
const MAX = 2;
const STEP = 0.05;

const FIELDS: { key: keyof ProgramMargins; label: string }[] = [
  { key: "top", label: "Top" },
  { key: "right", label: "Right" },
  { key: "bottom", label: "Bottom" },
  { key: "left", label: "Left" },
];

/** "Margins" button + popover. Clicking the button opens a small
 *  panel with four numeric inputs (top / right / bottom / left, in
 *  inches) that drive the live preview. Reset returns to the
 *  variant's built-in defaults. */
export function MarginsButton({ variant, margins, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  function setField(key: keyof ProgramMargins, raw: number) {
    const v = Number.isFinite(raw) ? Math.min(MAX, Math.max(MIN, raw)) : margins[key];
    onChange({ ...margins, [key]: v });
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Page margins"
        className="hidden lg:inline-flex items-center gap-1.5 rounded-md border border-border-strong bg-chalk px-2.5 py-1 font-sans text-[12px] font-semibold text-walnut hover:bg-parchment-2 hover:border-walnut-3 transition-colors normal-case tracking-normal"
      >
        <MarginsIcon />
        Margins
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 w-[15rem] rounded-lg border border-border bg-chalk shadow-elev-3 z-50 p-3"
        >
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-walnut-3 mb-2">
            Page margins (in)
          </div>
          <div className="grid grid-cols-2 gap-2">
            {FIELDS.map(({ key, label }) => (
              <label key={key} className="flex flex-col gap-1">
                <span className="font-sans text-[11px] text-walnut-2">{label}</span>
                <input
                  type="number"
                  step={STEP}
                  min={MIN}
                  max={MAX}
                  value={margins[key]}
                  onChange={(e) => setField(key, Number.parseFloat(e.target.value))}
                  className="font-sans text-[13px] px-2 py-1 bg-chalk border border-border-strong rounded-md text-walnut focus:outline-none focus:border-bordeaux focus:ring-2 focus:ring-bordeaux/15"
                />
              </label>
            ))}
          </div>
          <button
            type="button"
            onClick={() => onChange(DEFAULT_MARGINS[variant])}
            className="mt-3 w-full font-sans text-[12px] font-semibold px-2 py-1.5 rounded-md border border-border-strong bg-chalk text-walnut-2 hover:bg-parchment-2 hover:text-walnut transition-colors"
          >
            Reset to default
          </button>
        </div>
      )}
    </div>
  );
}

function MarginsIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <rect x="3" y="3" width="18" height="18" rx="1" />
      <rect x="6" y="6" width="12" height="12" rx="0.5" strokeDasharray="2 2" />
    </svg>
  );
}
