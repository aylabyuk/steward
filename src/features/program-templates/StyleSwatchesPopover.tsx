import { useState } from "react";
import type { LexicalEditor } from "lexical";
import { patchSelectionStyle } from "@/features/page-editor/toolbar/utils/patchStyleWithChips";
import { cn } from "@/lib/cn";

interface ColorToken {
  label: string;
  value: string | null;
  swatch: string;
}

const COLORS: ColorToken[] = [
  { label: "Default", value: null, swatch: "transparent" },
  { label: "Walnut", value: "var(--color-walnut)", swatch: "#3b2a22" },
  { label: "Walnut 2", value: "var(--color-walnut-2)", swatch: "#5a4636" },
  { label: "Walnut 3", value: "var(--color-walnut-3)", swatch: "#8a7460" },
  { label: "Brass deep", value: "var(--color-brass-deep)", swatch: "#8e6a36" },
  { label: "Bordeaux", value: "var(--color-bordeaux)", swatch: "#8b2e2a" },
  { label: "Ink", value: "var(--color-ink)", swatch: "#231815" },
];

interface FontToken {
  label: string;
  value: string | null;
}
const FONTS: FontToken[] = [
  { label: "Default", value: null },
  { label: "Serif", value: "var(--font-serif), serif" },
  { label: "Sans", value: "var(--font-sans), sans-serif" },
  { label: "Mono", value: "var(--font-mono), monospace" },
];

interface SizeToken {
  label: string;
  value: string | null;
}
const SIZES: SizeToken[] = [
  { label: "Default", value: null },
  { label: "Sm", value: "13px" },
  { label: "Base", value: "15px" },
  { label: "Lg", value: "17px" },
  { label: "Xl", value: "20px" },
];

interface Props {
  editor: LexicalEditor;
}

/** Inline style picker — design-token color / font-family / font-size
 *  applied to the current selection via `@lexical/selection`'s
 *  `$patchStyleText`. Constrained to the system tokens defined in
 *  `src/styles/index.css` so authors can stylize without drifting
 *  off-brand. Mounted from `FloatingSelectionToolbar` behind a small
 *  "A" trigger so it doesn't crowd the always-visible buttons. */
export function StyleSwatchesPopover({ editor }: Props) {
  function applyStyle(patch: Record<string, string | null>) {
    patchSelectionStyle(editor, patch);
  }

  return (
    <div
      role="dialog"
      aria-label="Text style"
      className="absolute top-[calc(100%+6px)] left-1/2 -translate-x-1/2 w-72 rounded-lg border border-border-strong bg-chalk shadow-elev-3 p-3 flex flex-col gap-3"
      onMouseDown={(e) => e.preventDefault()}
    >
      <Section label="Color">
        <div className="flex gap-1.5 flex-wrap">
          {COLORS.map((c) => (
            <button
              key={c.label}
              type="button"
              aria-label={c.label}
              title={c.label}
              onClick={() => applyStyle({ color: c.value })}
              className={cn(
                "h-6 w-6 rounded-full border border-border-strong transition-shadow",
                c.value === null &&
                  "bg-[repeating-linear-gradient(45deg,_var(--color-border-strong)_0_2px,_transparent_2px_4px)]",
              )}
              style={c.value !== null ? { background: c.swatch } : undefined}
            />
          ))}
        </div>
      </Section>
      <Section label="Font">
        <div className="flex gap-1.5 flex-wrap">
          {FONTS.map((f) => (
            <button
              key={f.label}
              type="button"
              onClick={() => applyStyle({ "font-family": f.value })}
              className="px-2.5 h-7 rounded-full border border-border-strong text-[12px] hover:bg-parchment-2"
              style={f.value ? { fontFamily: f.value } : undefined}
            >
              {f.label}
            </button>
          ))}
        </div>
      </Section>
      <Section label="Size">
        <div className="flex gap-1.5 flex-wrap">
          {SIZES.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => applyStyle({ "font-size": s.value })}
              className="px-2.5 h-7 rounded-full border border-border-strong text-[12px] hover:bg-parchment-2"
            >
              {s.label}
            </button>
          ))}
        </div>
      </Section>
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

/** Toggleable trigger button + popover — exported so `floatingToolbarButtons`
 *  can drop it into the toolbar pill alongside Bold / Italic / etc. */
export function StyleSwatchesButton({ editor }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-label="Text style"
        title="Text style"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "h-7 min-w-7 px-1.5 rounded-full grid place-items-center text-[12.5px] text-walnut hover:bg-parchment-2 transition-colors",
          open && "bg-walnut text-parchment hover:bg-walnut-2 hover:text-parchment",
        )}
      >
        A
      </button>
      {open && <StyleSwatchesPopover editor={editor} />}
    </span>
  );
}
