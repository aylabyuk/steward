import { useState } from "react";
import {
  PAGE_SIZE_INCHES,
  PAGE_SIZES,
  type LetterPageStyle,
  type Orientation,
  type PageSize,
} from "@/lib/types/template";
import { ToolbarButton } from "./ToolbarButton";

interface Props {
  value: LetterPageStyle | null | undefined;
  onChange: (next: LetterPageStyle) => void;
}

const DEFAULT: LetterPageStyle = {
  borderColor: "none",
  borderWidth: 0,
  borderStyle: "solid",
  paper: "chalk",
  pageSize: "letter",
  orientation: "portrait",
};

/** Page-size + orientation dropdown — mirrors the Lexical-playground
 *  "page settings" selector. Picks paper size from the standard set
 *  declared in `PAGE_SIZES` and toggles orientation. The actual
 *  geometry is applied by `PageCanvas` based on the chosen size. */
export function PageSizeDropdown({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const current = value ?? DEFAULT;

  function set(partial: Partial<LetterPageStyle>) {
    onChange({ ...current, ...partial });
  }

  const sizeLabel = PAGE_SIZE_INCHES[current.pageSize].label;
  return (
    <span className="relative inline-flex">
      <ToolbarButton label="Page size" onClick={() => setOpen((o) => !o)} className="gap-1.5">
        <span aria-hidden>📄</span>
        <span aria-hidden className="text-walnut-3 text-[10px]">
          ▾
        </span>
      </ToolbarButton>
      {open && (
        <div
          role="menu"
          className="absolute top-[calc(100%+4px)] right-0 z-30 w-72 rounded-md border border-border-strong bg-chalk shadow-elev-3 py-2 px-2 flex flex-col gap-2"
          onMouseDown={(e) => e.preventDefault()}
        >
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-walnut-3 px-2 mb-1">
              Page size
            </div>
            <div className="flex flex-col">
              {PAGE_SIZES.map((sz: PageSize) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => set({ pageSize: sz })}
                  className={`w-full px-3 py-1.5 text-left text-[13px] rounded hover:bg-parchment-2 ${current.pageSize === sz ? "bg-parchment-2/60" : ""}`}
                >
                  {PAGE_SIZE_INCHES[sz].label}
                </button>
              ))}
            </div>
          </div>
          <div className="border-t border-border" />
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-walnut-3 px-2 mb-1">
              Orientation
            </div>
            <div className="flex gap-1.5 px-2">
              {(["portrait", "landscape"] as Orientation[]).map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => set({ orientation: o })}
                  className={`flex-1 px-2 py-1.5 text-[12px] rounded border ${current.orientation === o ? "border-walnut bg-walnut text-parchment" : "border-border-strong bg-chalk text-walnut hover:bg-parchment-2"}`}
                >
                  {o[0].toUpperCase() + o.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="font-mono text-[10px] text-walnut-3 text-center pt-1">
            Currently: {sizeLabel} · {current.orientation}
          </div>
        </div>
      )}
    </span>
  );
}
