import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { REACTION_EMOJI } from "./reactions";

interface Props {
  onPick: (emoji: string) => void;
  mine: boolean;
}

/** Small "+" trigger + popover with the fixed reaction emoji set.
 *  Renders inline beside a bubble; the popover closes on outside
 *  click or Escape. Kept intentionally minimal — no custom emoji,
 *  no skin tones — to stay under the component cap and avoid the
 *  emoji-picker dependency cost on a tiny chat surface. */
export function ReactionPicker({ onPick, mine }: Props): React.ReactElement {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Add reaction"
        aria-expanded={open}
        className="opacity-40 hover:opacity-100 focus-visible:opacity-100 w-6 h-6 rounded-full border border-border bg-chalk text-walnut-3 text-[12px] leading-none flex items-center justify-center hover:bg-parchment-2 transition-opacity"
      >
        <span aria-hidden="true">+</span>
      </button>
      {open && (
        <div
          role="menu"
          className={cn(
            "absolute z-10 bottom-full mb-1 flex gap-1 bg-chalk border border-border rounded-full px-2 py-1 shadow-elev-1",
            mine ? "right-0" : "left-0",
          )}
        >
          {REACTION_EMOJI.map((emoji) => (
            <button
              key={emoji}
              type="button"
              role="menuitem"
              onClick={() => {
                onPick(emoji);
                setOpen(false);
              }}
              className="w-7 h-7 text-[16px] leading-none rounded-full hover:bg-parchment-2 focus-visible:bg-parchment-2 focus:outline-none transition-colors"
              aria-label={`React with ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
