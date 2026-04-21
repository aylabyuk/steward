import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

export interface OverflowMenuItem {
  label: string;
  onSelect: () => void;
  destructive?: boolean;
}

interface Props {
  items: readonly OverflowMenuItem[];
  ariaLabel?: string;
}

export function OverflowMenu({ items, ariaLabel = "More actions" }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center justify-center w-7 h-7 rounded-md text-walnut-3 hover:text-walnut border border-transparent hover:border-border hover:bg-parchment-2 transition-colors leading-none"
      >
        <span className="text-lg -mt-0.5">⋯</span>
      </button>
      {open && (
        <ul
          role="menu"
          className="absolute right-0 mt-1.5 min-w-44 bg-chalk border border-border rounded-lg shadow-[0_10px_28px_rgba(58,37,25,0.12),0_2px_6px_rgba(58,37,25,0.06)] p-1.5 z-20 animate-[menuIn_120ms_ease-out] list-none m-0"
        >
          {items.map((item) => (
            <li key={item.label} role="none">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  item.onSelect();
                }}
                className={cn(
                  "w-full text-left font-sans text-[13px] px-3 py-1.5 rounded-sm transition-colors",
                  item.destructive
                    ? "text-bordeaux hover:bg-danger-soft"
                    : "text-walnut hover:bg-parchment",
                )}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
