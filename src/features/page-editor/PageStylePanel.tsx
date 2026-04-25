import { useState } from "react";
import type { LetterPageStyle } from "@/lib/types/template";
import { cn } from "@/lib/cn";

type BorderColor = LetterPageStyle["borderColor"];
type Paper = LetterPageStyle["paper"];

const BORDER_COLOR_SWATCH: Record<BorderColor, string> = {
  none: "bg-transparent border border-dashed border-border-strong",
  walnut: "bg-walnut",
  "brass-deep": "bg-brass-deep",
  bordeaux: "bg-bordeaux",
};

const PAPER_SWATCH: Record<Paper, string> = {
  chalk: "bg-chalk border border-border-strong",
  parchment: "bg-parchment border border-border-strong",
  "parchment-2": "bg-parchment-2 border border-border-strong",
};

const DEFAULT_STYLE: LetterPageStyle = {
  borderColor: "none",
  borderWidth: 0,
  borderStyle: "solid",
  paper: "chalk",
};

interface Props {
  value: LetterPageStyle | null | undefined;
  onChange: (next: LetterPageStyle) => void;
  /** When true, the panel renders read-only swatches (no click handlers). */
  disabled?: boolean;
}

/** Pill-button + popover that edits the page-frame styling (border
 *  color/width/style + paper color). Mounts at the top-right of the
 *  page editor's parchment area so it doesn't compete with the
 *  letter's own chrome. Auto-applies on every change so the bishop
 *  sees the canvas update live. Persistence happens in the route
 *  via the same dual-writing `writeSpeakerLetterTemplate`. */
export function PageStylePanel({ value, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const style = value ?? DEFAULT_STYLE;

  function patch(partial: Partial<LetterPageStyle>) {
    const next = { ...style, ...partial };
    // Auto-couple color & width so the bishop never sets a color
    // they can't see (and never sets a width without a color).
    if ("borderColor" in partial) {
      if (next.borderColor !== "none" && next.borderWidth < 1) next.borderWidth = 2;
      if (next.borderColor === "none") next.borderWidth = 0;
    }
    if ("borderWidth" in partial) {
      if (next.borderWidth === 0) next.borderColor = "none";
      else if (next.borderColor === "none") next.borderColor = "walnut";
    }
    onChange(next);
  }

  return (
    <div className="absolute top-2 right-2 z-20">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-full border border-border-strong bg-chalk px-3 py-1 font-mono text-[10.5px] uppercase tracking-[0.14em] text-walnut-2 hover:bg-parchment-2 disabled:opacity-50"
      >
        <span aria-hidden>⚙</span>
        Page style
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Page style"
          className="absolute right-0 mt-2 w-72 rounded-lg border border-border-strong bg-chalk shadow-elev-3 p-4 flex flex-col gap-4"
        >
          <Section label="Border color">
            <div className="flex gap-2">
              {(Object.keys(BORDER_COLOR_SWATCH) as BorderColor[]).map((c) => (
                <Swatch
                  key={c}
                  active={style.borderColor === c}
                  className={BORDER_COLOR_SWATCH[c]}
                  label={c}
                  onClick={() => patch({ borderColor: c })}
                />
              ))}
            </div>
          </Section>
          <Section label="Border width">
            <input
              type="range"
              min={0}
              max={4}
              step={1}
              value={style.borderWidth}
              onChange={(e) => patch({ borderWidth: Number(e.target.value) })}
              className="w-full accent-walnut"
            />
            <div className="font-mono text-[10px] text-walnut-3 tabular-nums">
              {style.borderWidth}px
            </div>
          </Section>
          <Section label="Paper">
            <div className="flex gap-2">
              {(Object.keys(PAPER_SWATCH) as Paper[]).map((p) => (
                <Swatch
                  key={p}
                  active={style.paper === p}
                  className={PAPER_SWATCH[p]}
                  label={p}
                  onClick={() => patch({ paper: p })}
                />
              ))}
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-walnut-3">{label}</div>
      {children}
    </div>
  );
}

interface SwatchProps {
  active: boolean;
  className: string;
  label: string;
  onClick: () => void;
}

function Swatch({ active, className, label, onClick }: SwatchProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "h-7 w-7 rounded-full transition-shadow",
        className,
        active && "ring-2 ring-offset-2 ring-walnut",
      )}
    />
  );
}
